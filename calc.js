'use strict';
//Временные элементы ввода
const TEMP_INPUT_ELEMENTS_STR = 
`<br><input type="number" name="big-shelf" id="big-shelf" value="0"><label for="big-shelf">Big Shelf</label><br>
<input type="number" name="small-shelf" id="small-shelf" value="0"><label for="small-shelf">Small Shelf</label><br>
<input type="number" name="gloves" id="gloves" value="0"><label for="gloves">gloves</label><br>
<input type="number" name="large-grow-tray" id="large-grow-tray" value="0"><label for="large-grow-tray">Large Grow Tray</label><br>`;

const CARD_TYPES = {
    SMALL_SHELF : parseInt("010", 2),
    BIG_SHELF : parseInt("100", 2),
    EXTRA_GOODS : parseInt("001", 2)
};

const FREE_COST_WEIGHT = 11;

const GROUP_ID = {
    BIG_SHELF: '1',
    SMALL_SHELF: '2'
}

//Временные карточки товаров
const TEMP_GOODS = [
    {
        id: 'big-shelf',
        group_id:'1',
        weight:0,
        volWeight:0,
        extraAdds:0
    },
    {
        id: 'small-shelf',
        group_id:'2',
        weight:0,
        volWeight:0,
        extraAdds:0
    },
    {
        id: 'gloves',
        group_id:'4',
        weight:0,
        volWeight:0.32,
        extraAdds:0
    },
    {
        id: 'large-grow-tray',
        group_id:'4',
        weight:0.4,
        volWeight:1.31,
        extraAdds:0.28
    },
];

const SHELFS_DELIVERY_PRECE = {
    BIG_SHELF: {
        '1' : 30,
        '2' : 50,
        '3' : 70,
        '4' : 80,
        '5' : 5
    },
    SMALL_SHELF: {
        '1' : 10,
        '2' : 10,
        '3' : 30,
        '4' : 80,
        '5' : 5
    }
}

const DELIVERY_PRICE = {
    UNDER2KG : [
        {
            small_w: 0,
            big_w: 0.1,
            price: {
                '1' : 1.72,
                '2' : 1.72,
                '3' : 1.52,
                '4' : 1.52,
                '5' : 0.79 
            }
        },
        {
            small_w: 0.101,
            big_w: 0.500,
            price: {
                '1' : 3.05,
                '2' : 3.05,
                '3' : 3.79,
                '4' : 3.79,
                '5' : 0.99 
            }
        },
        {
            small_w: 0.501,
            big_w: 1.000,
            price: {
                '1' : 5.6,
                '2' : 5.6,
                '3' : 8.41,
                '4' : 8.41,
                '5' : 1.19 
            }
        },
        {
            small_w: 1.001,
            big_w: 2.000,
            price: {
                '1' : 8.41,
                '2' : 8.41,
                '3' : 12.62,
                '4' : 12.62,
                '5' : 1.59 
            }
        }
    ],
    OVER2KG : [
        {
            small_w: 2,
            big_w: 4,
            price: {
                '1' : 1.72,
                '2' : 1.72,
                '3' : 1.52,
                '4' : 1.52,
                '5' : 0.79 
            }
        },
        {
            small_w: 4.001,
            big_w: 6,
            price: {
                '1' : 3.05,
                '2' : 3.05,
                '3' : 3.79,
                '4' : 3.79,
                '5' : 0.99 
            }
        },
        {
            small_w: 6.001,
            big_w: 8,
            price: {
                '1' : 5.6,
                '2' : 5.6,
                '3' : 8.41,
                '4' : 8.41,
                '5' : 1.19 
            }
        },
        {
            small_w: 8.001,
            big_w: 10,
            price: {
                '1' : 8.41,
                '2' : 8.41,
                '3' : 12.62,
                '4' : 12.62,
                '5' : 1.59 
            }
        }
    ]
}

const CONTRIES_ZONES = {
'Estonia':1,
'Latvia':1, 
'Poland':1,

'Denmark':2,
'Finland':2,
'Germany':2,
'Sweden':2,
'Ireland':2,
'Austria':2,
'Belgium':2,
'Spain':2,
'Italy':2,
'Great Britain':2,
'Luksemburg':2,
'Monaco':2,
'Holland/Netherlands':2,
'France':2,
'Slovakia':2,
'Vatican':2,
'Hungary':2,
'Czech republic':2,
'Bulgaria':2,
'Greece':2,
'Croatia':2,
'Portugal':2,
'Romania':2,
'Slovenia':2,

'Lichtenstein':3,
'Norway':3,
'Switzerland':3,

'Iceland':4,

'Lithuania':5
};

class CalcModel{
    _controller;
    _contries;
    constructor(zones){
        this._contries = Object.keys(zones);
    }

    get contriesList(){
        return this._contries;
    }

    set controller(obj){
        this._controller = obj;
    }

    get controller(){
        return this._controller;
    }

    calcDeliveryCost(goods, destination){
        let destinationZone = this.getZonebyCountry(destination);
        let cartType = 0;

        for (let i = 0; i < goods.length; i++) {
            const item = goods[i];
            switch (item[0].group_id) {
                case GROUP_ID.SMALL_SHELF:
                    cartType = cartType | CARD_TYPES.SMALL_SHELF;
                    break;
                case GROUP_ID.BIG_SHELF:
                    cartType = cartType | CARD_TYPES.BIG_SHELF;
                    break;
                default:
                    cartType = cartType | CARD_TYPES.EXTRA_GOODS;
                    break;
            }
        }
        
        //в заказе и большая и маленькая полки
        if ((cartType & CARD_TYPES.SMALL_SHELF) && (cartType & CARD_TYPES.BIG_SHELF)) {
            //а так же экстратовары
            if (cartType & CARD_TYPES.EXTRA_GOODS) {
                return this.calcSmallShelfExtra(goods, destinationZone);
            //и нет экстратоваров
            } else {
                return this.calcShelfsOnly(goods, destinationZone);
            }
        }else{
                //в заказе только большая тележка
                if (cartType & CARD_TYPES.BIG_SHELF) {
                    //и есть допы
                    if (cartType & CARD_TYPES.EXTRA_GOODS) {
                        return this.calcBigShelfExtra(goods, destinationZone);
                    //и нет допов
                    } else {
                        return this.calcShelfsOnly(goods, destinationZone);
                    }
                }
                    
                //в заказе только малая тележка
                if (cartType & CARD_TYPES.SMALL_SHELF) {
                    //и есть допы
                    if (cartType & CARD_TYPES.EXTRA_GOODS) {
                        return this.calcSmallShelfExtra(goods, destinationZone);
                    //и нет допов
                    } else {
                        return this.calcShelfsOnly(goods, destinationZone);
                    }
                }
                //в заказе только допы
                return this.calcExtraOnly(goods, destinationZone);
        }
    }

    calcShelfsOnly(goods, destinationZone){
        let price = 0;
        goods.forEach(item => {
            let quantity = item[1];
            let product = item[0];
            if (product.group_id === GROUP_ID.BIG_SHELF) {
                price += SHELFS_DELIVERY_PRECE.BIG_SHELF[String(destinationZone)] * quantity;
            }
            if (product.group_id === GROUP_ID.SMALL_SHELF) {
                price += SHELFS_DELIVERY_PRECE.SMALL_SHELF[String(destinationZone)] * quantity;
            }
        });
        return price;
    }
    
    calcBigShelfExtra(goods, destinationZone){
        let price = 0;
        let extraWeight = 0;
        goods.forEach(item => {
            let quantity = item[1];
            let product = item[0];
            if (product.group_id === GROUP_ID.BIG_SHELF) {
                price += SHELFS_DELIVERY_PRECE.BIG_SHELF[String(destinationZone)] * quantity;
            }else{
                let calcWeight = (product.weight > product.volWeight) ? product.weight : product.volWeight;
                if (!!product.extraAdds) {           
                    extraWeight += calcWeight + product.extraAdds * (quantity - 1);
                } else {
                    extraWeight += calcWeight * quantity;
                }
            }
        });
        price += this.getPriceByWeight(extraWeight, destinationZone);
        return price;
    }

    calcSmallShelfExtra(goods, destinationZone){
        let price = 0;
        let extraWeight = 0;
        goods.forEach(item => {
            let quantity = item[1];
            let product = item[0];
            if (product.group_id === GROUP_ID.BIG_SHELF) {
                price += SHELFS_DELIVERY_PRECE.BIG_SHELF[String(destinationZone)] * quantity;
            }
            if (product.group_id === GROUP_ID.SMALL_SHELF) {
                price += SHELFS_DELIVERY_PRECE.SMALL_SHELF[String(destinationZone)] * quantity;
            }
            if ((product.group_id !== GROUP_ID.BIG_SHELF) && (product.group_id !== GROUP_ID.SMALL_SHELF)) {
                let calcWeight = (product.weight > product.volWeight) ? product.weight : product.volWeight;
                if (!!product.extraAdds) {           
                    extraWeight += calcWeight + product.extraAdds * (quantity - 1);
                } else {
                    extraWeight += calcWeight * quantity;
                }
            }
        });
        if (extraWeight > FREE_COST_WEIGHT) {
            price += this.getPriceByWeight((extraWeight - FREE_COST_WEIGHT), destinationZone);   
        }
        return price;  
    }

    calcExtraOnly(goods, destinationZone){
        let price = 0;
        let extraWeight = 0;
        goods.forEach(item => {
            let quantity = item[1];
            let product = item[0];
            let calcWeight = (product.weight > product.volWeight) ? product.weight : product.volWeight;
            if (!!product.extraAdds) {           
                extraWeight += calcWeight + product.extraAdds * (quantity - 1);
            } else {
                extraWeight += calcWeight * quantity;
            }
        });
        price += this.getPriceByWeight(extraWeight, destinationZone);
        return price;  
    }

    getPriceByWeight(weight, destinationZone){
        let price = NaN;
        if (weight <= 2) {
            DELIVERY_PRICE.UNDER2KG.forEach(item => {
                if ((weight < item.big_w) && (weight > item.small_w)) {
                    price = item.price[String(destinationZone)];
                }
            });
        }
        if (weight > 2) {
            DELIVERY_PRICE.OVER2KG.forEach(item => {
                if ((weight < item.big_w) && (weight > item.small_w)) {
                    price = item.price[String(destinationZone)];
                }
            });
        }
        return price;
    }

    getZonebyCountry(destination){
        return CONTRIES_ZONES[destination];
    }

    formGoodsArray(goodsArray){
        return goodsArray.map((item =>{
            return [this.getProductByID(item.id), item.count];
        }));
    }

    getProductByID(id){
        for (let i = 0; i < TEMP_GOODS.length; i++) {
            const element = TEMP_GOODS[i];
            if (element.id === id) {
                return element;
            }
        }
    }
}

class CalcController{
    _model;
    _view; 
    constructor(model, view){
        this._model = model;
        this._model.controller = this;
        this._view = view;
        this._view.controller = this;
    }

    get contries(){
        return this._model.contriesList;
    }

    addCalcEvent(){
        let _self = this;
        let clickHandler = function(e){
            e.preventDefault();
            let goodsArray = this._model.formGoodsArray(this._view.getGoodsArray());
            let destinationCountry = this._view.getDestinationCountry();
            let deliveryCost = this._model.calcDeliveryCost(goodsArray, destinationCountry);
            this._view.showCost(deliveryCost);
        }
        document.getElementById('calc-btn').addEventListener('click', function(evt){
            clickHandler.call(_self, evt)
        });
    }


}

class CalcView {
    _controller;
    calcDivElement;
    
    constructor(calcDivId){
        this.calcDivElement = document.getElementById(calcDivId);
    }

    showCost(cost){
        if (isNaN(cost)) {
            cost = 'Call to us by phone';
        }
        document.getElementById('delivery-cost').innerHTML = cost;
    }

    getGoodsArray(){
        let goodsArray = [];
        this.calcDivElement.querySelectorAll('input[type="number"]').forEach(function(element){
            if (element.value > 0) {
                goodsArray.push({
                    id: element.id,
                    count: element.value
                });
            }
        });
        return goodsArray;
    }

    getDestinationCountry(){
        return document.getElementById('contry-id').value;
    }

    setHtmlElements(){
        let contiesSelectStr = this.getSelectStr(this._controller._model.contriesList, ['select-contries'], 'contry-id');
        let calcBtnStr = '<button id="calc-btn">Calc</button>';
        let deliveryCostStr = `<div id="delivery-cost"></div>`;
        this.calcDivElement.innerHTML = contiesSelectStr + TEMP_INPUT_ELEMENTS_STR + calcBtnStr + deliveryCostStr;
    }

    getSelectStr(contriesArr, classes, id){
        let selectClassesStr = classes.reduce(function(prevStr, current) {
            return prevStr + ` ${current}`;    
        }, '').trim();
        let contriesStr = `<select class="${selectClassesStr}" id="${id}">`;
        contriesStr += contriesArr.reduce(function(prevStr, currentContry) {
            return prevStr += `<option>${currentContry}</option>`;
        }, ''); 
        contriesStr += '</select>';
        return contriesStr;
    }

    set controller(obj){
        this._controller = obj;
    }

    get controller(){
        return this._controller;
    }
}

let calcModel = new CalcModel(CONTRIES_ZONES);
let calcView = new CalcView('calc');
let calcController = new CalcController(calcModel, calcView);
calcView.setHtmlElements();
calcController.addCalcEvent();
