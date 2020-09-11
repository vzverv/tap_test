"use strict";

export interface FTPList {
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

export interface CampaignData {
    campaign_id: string,
    campaign_name: string,
    date: string,
    impressions: number,
}

export interface CampaignDataAggregated {
    campaign_id: string,
    campaign_name: string,
    date: string,
    total_impressions: number,
}

export interface CreativeData {
    creative_id: string,
    creative_name: string,
    campaign_id: string,
    date: string,
    impressions: number,
}

export interface CreativeDataAggregated {
    creative_id: string,
    creative_name: string,
    campaign_id: string,
    date: string,
    total_impressions: number,
}