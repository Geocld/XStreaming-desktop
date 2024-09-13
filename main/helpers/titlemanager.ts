import Application from '../application'
import HTTP from './http'
import Store from 'electron-store'
interface titleInfoArgs {
    ProductTitle: string;
    PublisherName: string;
    XCloudTitleId: string;
    Image_Tile: any;
    Image_Poster: any;
    Streamability: any;
    Categories: any;
    LocalizedCategories: any;
    XCloudOfferings: any;
    XboxTitleId: string;
    ChildXboxTitleIds: any;
    StoreId: string;
}

interface FilterArgs {
    name: string;
}

export default class TitleManager {

    _application:Application
    _store = new Store()
    _http:HTTP

    _xCloudTitles = {}
    _productIdQueue = []

    _xCloudRecentTitles = {}
    _xCloudRecentTitlesLastUpdate = 0

    
    constructor(application){
        this._application = application
        this._http = new HTTP(this._application)
    }

    getGamePassProducts(titles) {
        return new Promise((resolve, reject) => {
            const productIdQueue = [];
            if (!Array.isArray(titles)) {
                resolve([]);
            }
            titles.forEach(title => {
                if (title.details && title.details.productId) {
                    productIdQueue.push(title.details.productId);
                }
            });

            // TODO: officialTitles
            const officialTitles = []
            const mergeProductIds = [
                ...new Set([...productIdQueue, ...officialTitles]),
            ];

            this._http.post('catalog.gamepass.com', '/v3/products?market=US&language=en-US&hydration=RemoteHighSapphire0', { // RemoteLowJade0
                'Products': mergeProductIds,
            }, {
                'ms-cv': 0,
                'calling-app-name': 'Xbox Cloud Gaming Web',
                'calling-app-version': '24.17.63',

            }).then((result:any) => {
                const products = result.Products;
                const mergedTitles = [];
                for (const key in products) {
                    mergedTitles.push({
                        productId: key,
                        ...products[key],
                    });
                }
                mergedTitles.sort((a, b) =>
                    a.ProductTitle.localeCompare(b.ProductTitle),
                );
                resolve(mergedTitles);
            }).catch(e => {
                console.log('getGamePassProducts error:', e);
                reject(e);
            });
        })
    }

    getNewTitles(){
        return this._http.get('catalog.gamepass.com', '/sigls/v2?id=f13cf6b4-57e6-4459-89df-6aec18cf0538&market=US&language=en-US')
    }
}

interface TitleDetails {
    titleId:string;
    details: {
        productId:string;
        xboxTitleId:number;
        hasEntitlement:boolean;
        supportsInAppPurchases:boolean;
        supportedTabs: any;
        supportedInputTypes: any;
        programs: any;
        userPrograms: any;
        userSubscriptions: any;
        isFreeInStore: boolean;
        maxGameplayTimeInSeconds: number;
    };
}

export class Title {

    titleId
    productId
    xboxTitleId
    supportedInputTypes
    catalogDetails

    constructor(title:TitleDetails){
        this.titleId = title.titleId
        this.productId = title.details.productId
        this.xboxTitleId = title.details.xboxTitleId
        this.supportedInputTypes = title.details.supportedInputTypes
    }

    setCatalogDetails(titleInfo:titleInfoArgs){
        this.catalogDetails = titleInfo
    }

    toString(){
        return JSON.stringify(this)
    }

    restoreFromCache(cachedObj){
        this.catalogDetails = cachedObj.catalogDetails
    }
}