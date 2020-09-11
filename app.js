"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var FTP = require('ftp');
var promisify = require('util').promisify;
var csv = require('csvtojson');
var mysql = require('mysql');
var winston = require("winston");
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});
/**
 * Output data as a table to console.
 * @param header
 * @param data
 */
function outputConsoleTable(header, data) {
    console.info(header);
    console.table(data);
}
;
/**
 * @param dataFiles
 * @param getFileFromFTP
 */
function retriveDataFromFTP(dataFiles, getFileFromFTP) {
    return __awaiter(this, void 0, void 0, function () {
        var dataFromFiles, _i, dataFiles_1, fileData, stream, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    dataFromFiles = [];
                    _i = 0, dataFiles_1 = dataFiles;
                    _c.label = 1;
                case 1:
                    if (!(_i < dataFiles_1.length)) return [3 /*break*/, 5];
                    fileData = dataFiles_1[_i];
                    return [4 /*yield*/, getFileFromFTP(fileData.name)];
                case 2:
                    stream = _c.sent();
                    _b = (_a = dataFromFiles).concat;
                    return [4 /*yield*/, csv().fromStream(stream)];
                case 3:
                    dataFromFiles = _b.apply(_a, [_c.sent()]);
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/, dataFromFiles];
            }
        });
    });
}
/**
 * Prepare init array for aggregation.
 * @param givenDates
 */
function prepareDataArray(givenDates) {
    var aggregator = []; // aggregate data
    //let's prepare the dates we need
    givenDates.forEach(function (el) {
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
function buildCampaignData(dataFromFiles, campaignData) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, dataFromFiles_1, data;
        return __generator(this, function (_a) {
            // Campaign data view
            // campaign_id | campaign_name | date | total_impressions
            for (_i = 0, dataFromFiles_1 = dataFromFiles; _i < dataFromFiles_1.length; _i++) {
                data = dataFromFiles_1[_i];
                campaignData[data.Date].push({
                    campaign_id: data['Campaign ID'],
                    campaign_name: data['Campaign Name'],
                    date: data.Date,
                    impressions: data.Impressions
                });
            }
            return [2 /*return*/, campaignData];
        });
    });
}
/**
 * @param dataFromFiles
 * @param givenDates
 */
function buildCreativeData(dataFromFiles, creativeData) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, dataFromFiles_2, data;
        return __generator(this, function (_a) {
            // Creative data view
            for (_i = 0, dataFromFiles_2 = dataFromFiles; _i < dataFromFiles_2.length; _i++) {
                data = dataFromFiles_2[_i];
                creativeData[data.Date].push({
                    creative_id: data['Creative ID'],
                    creative_name: data['Creative Name'],
                    campaign_id: data['Campaign ID'],
                    date: data.Date,
                    impressions: data.Impressions
                });
            }
            return [2 /*return*/, creativeData];
        });
    });
}
/**
 * @param campaignData
 */
function prepareCampaignData(campaignData) {
    var aggregatedData = {}; // total aggregation
    // aggregate impressions
    campaignData.forEach(function (el) {
        aggregatedData[el.campaign_id] = (aggregatedData[el.campaign_id] || 0) + (+el.impressions);
    });
    // build a proper data structure for view
    var campaignViewData = [];
    campaignData.forEach(function (el) {
        if (!campaignData[el.campaign_id]) { // let's save some compute time
            campaignViewData[el.campaign_id] = {
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
function prepareCreativeData(creativeData) {
    var aggregatedData = {}; // total aggregation
    // aggregate impressions
    creativeData.forEach(function (el) {
        aggregatedData[el.creative_id] = (aggregatedData[el.creative_id] || 0) + (+el.impressions);
    });
    // build a proper data structure for view
    var creativeViewData = [];
    creativeData.forEach(function (el) {
        if (!creativeData[el.creative_id]) { // let's save some compute time
            creativeViewData[el.creative_id] = {
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
function handler(givenDates) {
    return __awaiter(this, void 0, void 0, function () {
        var ftpClient, onEvent, listFiles, filesList, filterValues, fileNames, advertisersFile, getFileFromFTP, stream, advertisers, dataFiles, dataFromFiles, campaignData, creativeData, finalCampaignTable, finalCreativeTable, _i, givenDates_1, date, connection;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ftpClient = new FTP();
                    ftpClient.connect({
                        host: "ftp.clickfuel.com",
                        user: "ftp_integration_test",
                        password: "6k0Sb#EXT6jw"
                    });
                    onEvent = promisify(ftpClient.on).bind(ftpClient);
                    return [4 /*yield*/, onEvent('ready').then(function () {
                            logger.info('ftp is ready');
                        })["catch"](function (e) {
                            logger.error('error, the ftp is not ready :(', e);
                        })];
                case 1:
                    _a.sent();
                    listFiles = promisify(ftpClient.list).bind(ftpClient);
                    return [4 /*yield*/, listFiles()];
                case 2:
                    filesList = _a.sent();
                    filterValues = givenDates;
                    filterValues.push('Advertisers');
                    fileNames = filesList.filter(function (el) {
                        return filterValues.some(function (value) { return el.name.includes(value); });
                    });
                    advertisersFile = fileNames.reduce(function (index, el) { return el.name.includes('Advertisers') ? el.name : ''; });
                    // we must have that file
                    if (!advertisersFile) {
                        throw Error('No filename for advertisers found');
                    }
                    getFileFromFTP = promisify(ftpClient.get).bind(ftpClient);
                    return [4 /*yield*/, getFileFromFTP(advertisersFile)];
                case 3:
                    stream = _a.sent();
                    return [4 /*yield*/, csv().fromStream(stream)];
                case 4:
                    advertisers = _a.sent();
                    // We do not filter by advertisers, we have them from the initial task
                    outputConsoleTable('Advertisers', advertisers);
                    dataFiles = fileNames.filter(function (el) { return !el.name.includes('Advertisers'); });
                    if (!dataFiles) {
                        throw Error('No files to process.');
                    }
                    return [4 /*yield*/, retriveDataFromFTP(dataFiles, getFileFromFTP)];
                case 5:
                    dataFromFiles = _a.sent();
                    return [4 /*yield*/, buildCampaignData(dataFromFiles, prepareDataArray(givenDates))];
                case 6:
                    campaignData = _a.sent();
                    return [4 /*yield*/, buildCreativeData(dataFromFiles, prepareDataArray(givenDates))];
                case 7:
                    creativeData = _a.sent();
                    finalCampaignTable = [];
                    finalCreativeTable = [];
                    for (_i = 0, givenDates_1 = givenDates; _i < givenDates_1.length; _i++) {
                        date = givenDates_1[_i];
                        finalCampaignTable = finalCampaignTable.concat(prepareCampaignData(campaignData[date]));
                        finalCreativeTable = finalCreativeTable.concat(prepareCreativeData(creativeData[date]));
                    }
                    outputConsoleTable('Campaign data', finalCampaignTable);
                    outputConsoleTable('Creatives data', finalCreativeTable);
                    // Creatives data view
                    // creative_id | creative_name | campaign_id, date, totali_mpressions
                    // mysql connection
                    if (false) { // we do not need mysql for this implementationS
                        connection = mysql.createConnection({
                            host: 'tap-mysql',
                            port: '3306',
                            user: 'app',
                            password: 'secret',
                            database: 'tap'
                        });
                        connection.connect(function () {
                            logger.info('connected to mysql');
                        });
                        connection.end(function () {
                            logger.info('mysql connection closed');
                        });
                    }
                    ftpClient.end();
                    return [2 /*return*/];
            }
        });
    });
}
exports.handler = handler;
handler(['2016-05-05', '2016-05-06']);
