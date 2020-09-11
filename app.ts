"use strict";

const FTP = require('ftp');
const { promisify } = require('util');
const csv = require('csvtojson');
const mysql = require('mysql');
import * as winston from 'winston';
import {FTPList, CampaignData, CampaignDataAggregated, CreativeData, CreativeDataAggregated} from './tap';

const logger = winston.createLogger(
    {
        level: 'info',
        format: winston.format.simple(),
        transports: [new winston.transports.Console()]
    }
);

/**
 * Output data as a table to console.
 * @param header 
 * @param data 
 */
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

/**
 * Prepare init array for aggregation.
 * @param givenDates 
 */
function prepareDataArray(givenDates: string[]){
    let aggregator = []; // aggregate data
    //let's prepare the dates we need
    givenDates.forEach(el => {
        aggregator[el] = [];
    });

    return aggregator;
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
async function buildCampaignData(dataFromFiles: any, campaignData: any[]) {
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
async function buildCreativeData(dataFromFiles: any, creativeData: any[]) {
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
export async function handler(givenDates: string[]) {

    const ftpClient = new FTP();

    ftpClient.connect({
        host: "ftp.clickfuel.com",
        user: "ftp_integration_test",
        password: "6k0Sb#EXT6jw"
    })

    const onEvent = promisify(ftpClient.on).bind(ftpClient);

    await onEvent('ready').then(() => {
        logger.info('ftp is ready');
    }).catch((e) => {
        logger.error('error, the ftp is not ready :(', e);
    });

    const listFiles = promisify(ftpClient.list).bind(ftpClient);
    const filesList = await listFiles();
    
    const filterValues = givenDates;
    filterValues.push('Advertisers');
    // filter values - we need only advertiser and everything for May 5,6
    const fileNames = filesList.filter((el: FTPList) => {
        return filterValues.some(value => el.name.includes(value));
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

    const campaignData = await buildCampaignData(dataFromFiles, prepareDataArray(givenDates));
    const creativeData = await buildCreativeData(dataFromFiles, prepareDataArray(givenDates));

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

    // mysql connection
    if (false) { // we do not need mysql for this implementationS
        const connection = mysql.createConnection({
            host: 'tap-mysql',
            port: '3306',
            user: 'app',
            password: 'secret',
            database: 'tap',
        });

        connection.connect(() => {
            logger.info('connected to mysql');
        });

        connection.end(() => {
            logger.info('mysql connection closed');
        });
    }

    ftpClient.end();
}

handler(['2016-05-05', '2016-05-06']);
