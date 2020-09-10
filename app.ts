"use strict";

const FTP = require('ftp');
const { promisify } = require('util');
const csv = require('csvtojson');
const mysql = require('mysql');

interface FTPList {
    type: string,
    name: string,
    target?: string,
    sticky: boolean,
    rights: object,
    acl: boolean,
    owner: string,
    group: string,
    size: number,
    date: string,
}

interface CampaignData {
    campaign_id: string,
    campaign_name: string,
    date: string,
    impressions: number,
}

interface CampaignDataAggregated {
    campaign_id: string,
    campaign_name: string,
    date: string,
    total_impressions: number,
}

interface CreativeData {
    creative_id: string,
    creative_name: string,
    campaign_id: string,
    date: string,
    impressions: number,
}

interface CreativeDataAggregated {
    creative_id: string,
    creative_name: string,
    campaign_id: string,
    date: string,
    total_impressions: number,
}

function outputConsoleTable(header: string, data: any) {
    console.info(header);
    console.table(data);
};

/**
 * @param dataFiles 
 * @param getFileFromFTP 
 */
async function retriveDataFromFTP(dataFiles, getFileFromFTP) {
    let dataFromFiles = [];
    //loop over file names, stream data from csv files to json objects
    for (const fileData of dataFiles) {
        const stream = await getFileFromFTP(fileData.name);
        dataFromFiles = dataFromFiles.concat(await csv().fromStream(stream));
    }

    return dataFromFiles;
}

/******** NOTE ********/
/*
    Next 2 pairs of functions look very similar, so the DRY violance is looking pretty obivous
    But it is not a violation, because they process different datasets, they build specific objects
    So, each of them has a very specific responsibility. Having it this way makes this script more flexible
    for future requests from business. Also, it alows to test them separately avoiding tight coupling
    of 2 different resulting tables logic.  
*/

/**
 * @param dataFromFiles 
 * @param givenDates 
 */
async function buildCampaignData(dataFromFiles, givenDates) {
    let campaignData = []; // aggregate data
    //let's prepare the dates we need
    givenDates.forEach(el => {
        campaignData[el] = [];
    });
    // Campaign data view
    // campaign_id | campaign_name | date | total_impressions
    for (const data of dataFromFiles) {
        campaignData[data.Date].push(<CampaignData>{
            campaign_id: data['Campaign ID'],
            campaign_name: data['Campaign Name'],
            date: data.Date,
            impressions: data.Impressions
        });
    }
    return campaignData;
}

/**
 * @param dataFromFiles 
 * @param givenDates 
 */
async function buildCreativeData(dataFromFiles: any, givenDates: string[]) {
    let creativeData = []; // aggregate data
    //let's prepare the dates we need
    givenDates.forEach(el => {
        creativeData[el] = [];
    });
    // Creative data view
    for (const data of dataFromFiles) {
        creativeData[data.Date].push(<CreativeData>{
            creative_id: data['Creative ID'],
            creative_name: data['Creative Name'],
            campaign_id: data['Campaign ID'],
            date: data.Date,
            impressions: data.Impressions
        });
    }
    return creativeData;
}

/**
 * @param campaignData 
 */
function prepareCampaignData(campaignData: CampaignData[]) {
    let aggregatedData = {}; // total aggregation

    // aggregate impressions
    campaignData.forEach(
        el => {
            aggregatedData[el.campaign_id] = (aggregatedData[el.campaign_id] || 0) + (+el.impressions);
        }
    );

    // build a proper data structure for view
    let campaignViewData = [];
    campaignData.forEach((el) => {
        if (!campaignData[el.campaign_id]) { // let's save some compute time
            campaignViewData[el.campaign_id] = <CampaignDataAggregated>{
                campaign_id: el.campaign_id,
                campaign_name: el.campaign_name,
                date: el.date,
                total_impressions: aggregatedData[el.campaign_id]
            };
        }
    });

    return campaignViewData;
}

/**
 * @param creativeData 
 */
function prepareCreativeData(creativeData: CreativeData[]) {
    let aggregatedData = {}; // total aggregation

    // aggregate impressions
    creativeData.forEach(
        el => {
            aggregatedData[el.creative_id] = (aggregatedData[el.creative_id] || 0) + (+el.impressions);
        }
    );

    // build a proper data structure for view
    let creativeViewData = [];
    creativeData.forEach((el) => {
        if (!creativeData[el.creative_id]) { // let's save some compute time
            creativeViewData[el.creative_id] = <CreativeDataAggregated>{
                creative_id: el.creative_id,
                creative_name: el.creative_name,
                campaign_id: el.campaign_id,
                date: el.date,
                total_impressions: aggregatedData[el.creative_id]
            };
        }
    });

    return creativeViewData;
}

/**
 * Main workflow.
 */
export async function handler() {

    const ftpClient = new FTP();

    ftpClient.connect({
        host: "ftp.clickfuel.com",
        user: "ftp_integration_test",
        password: "6k0Sb#EXT6jw"
    })

    const onEvent = promisify(ftpClient.on).bind(ftpClient);

    await onEvent('ready').then(() => {
        console.log('ftp is ready');
    }).catch((e) => {
        console.log('error, the ftp is not ready :(', e);
    });

    const listFiles = promisify(ftpClient.list).bind(ftpClient);
    const filesList = await listFiles();
    // let's imagine we received it as an external parameter
    const givenDates = ['2016-05-05', '2016-05-06'];
    const filterValues = givenDates;
    filterValues.push('Advertisers');
    // filter values - we need only advertiser and everything for May 5,6
    const fileNames = filesList.filter((el: FTPList) => {
        return filterValues.some(value => el.name.includes(value)) ;
    });

    // grab adevertisers file
    const advertisersFile = fileNames.reduce((index, el) => el.name.includes('Advertisers') ? el.name : '');
    // we must have that file
    if (!advertisersFile) {
        throw Error('No filename for advertisers found');
    }

    const getFileFromFTP = promisify(ftpClient.get).bind(ftpClient);

    const stream = await getFileFromFTP(advertisersFile);
    const advertisers = await csv().fromStream(stream);
    // We do not filter by advertisers, we have them from the initial task
    outputConsoleTable('Advertisers', advertisers);

    // grab everything but advertisers
    const dataFiles = fileNames.filter(el => !el.name.includes('Advertisers'));
    if (!dataFiles) {
        throw Error('No files to process.');
    }

    const dataFromFiles = await retriveDataFromFTP(dataFiles, getFileFromFTP);

    const campaignData = await buildCampaignData(dataFromFiles, givenDates);

    const creativeData = await buildCreativeData(dataFromFiles, givenDates);

    let finalCampaignTable: CampaignDataAggregated[] = [];
    let finalCreativeTable: CreativeDataAggregated[] = [];
    for (const date of givenDates) {
        finalCampaignTable = finalCampaignTable.concat(prepareCampaignData(campaignData[date]));
        finalCreativeTable = finalCreativeTable.concat(prepareCreativeData(creativeData[date]));
    }


    outputConsoleTable('Campaign data', finalCampaignTable);
    outputConsoleTable('Creatives data', finalCreativeTable);

    // Creatives data view
    // creative_id | creative_name | campaign_id, date, totali_mpressions

    // mysql connection{
    const connection = mysql.createConnection({
        host: 'tap-mysql',
        port: '3306',
        user: 'app',
        password: 'secret',
        database: 'tap',
    });

    connection.connect(() => {
        console.log('connected to mysql');
    });

    connection.end(() => {
        console.log('mysql connection closed');
    });

    ftpClient.end();
}

handler();
