'use strcit';

require('dotenv').config();
const puppeteer = require('puppeteer');
require('date-utils');
var fs = require('fs');
const axios = require('axios');
const qs = require('querystring');
const BASE_URL = 'https://notify-api.line.me';
const PATH = '/api/notify';
const LINE_TOKEN = process.env.LINE_NOTIFY_TOKE;


// １次元配列を２次元配列にする
function splitArray(array, part) {
    var tmp = [];
    for (var i = 0; i < array.length; i += part) {
        tmp.push(array.slice(i, i + part));
    }
    return tmp;
}

// 全角を半確認変換する
function hankaku2Zenkaku(str) {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

function getVacancyInfo(dateTime, searchResult) {

    // ２次元配列に置き換える
    const tempVacancyInfo = splitArray(searchResult, 15)

    let vacancyInfo = []

    let result = null

    let workDatetime = new Date(dateTime.getTime());

    result = tempVacancyInfo[2].map(function (value, index, array) {
        if (index > 0) {
            const obj = {
                date: workDatetime.toFormat("YYYY/MM/DD") + "(" + tempVacancyInfo[1][index] + ")" + " " + hankaku2Zenkaku(array[0]),
                vacancyCount: value
            }

            workDatetime.setTime(workDatetime.getTime() + 1 * 86400000);

            // 18:00 - 21:00以外はすべて土日のみの結果を取ってくる
            if ((tempVacancyInfo[1][index] == "土") || (tempVacancyInfo[1][index] == "日")) {
                return obj;
            }

        }
    });

    vacancyInfo = vacancyInfo.concat(result);

    workDatetime = new Date(dateTime.getTime());

    result = tempVacancyInfo[3].map(function (value, index, array) {
        if (index > 0) {
            const obj = {
                date: workDatetime.toFormat("YYYY/MM/DD") + "(" + tempVacancyInfo[1][index] + ")" + " " + hankaku2Zenkaku(array[0]),
                vacancyCount: value
            }

            workDatetime.setTime(workDatetime.getTime() + 1 * 86400000);

            // 18:00 - 21:00以外はすべて土日のみの結果を取ってくる
            if ((tempVacancyInfo[1][index] == "土") || (tempVacancyInfo[1][index] == "日")) {
                return obj;
            }
        }
    });

    vacancyInfo = vacancyInfo.concat(result);

    workDatetime = new Date(dateTime.getTime());

    result = tempVacancyInfo[4].map(function (value, index, array) {
        if (index > 0) {
            const obj = {
                date: workDatetime.toFormat("YYYY/MM/DD") + "(" + tempVacancyInfo[1][index] + ")" + " " + hankaku2Zenkaku(array[0]),
                vacancyCount: value
            }

            workDatetime.setTime(workDatetime.getTime() + 1 * 86400000);

            // 18:00 - 21:00以外はすべて土日のみの結果を取ってくる
            if ((tempVacancyInfo[1][index] == "土") || (tempVacancyInfo[1][index] == "日")) {
                return obj;
            }
        }
    });

    vacancyInfo = vacancyInfo.concat(result);

    workDatetime = new Date(dateTime.getTime());

    result = tempVacancyInfo[5].map(function (value, index, array) {
        if (index > 0) {
            const obj = {
                date: workDatetime.toFormat("YYYY/MM/DD") + "(" + tempVacancyInfo[1][index] + ")" + " " + hankaku2Zenkaku(array[0]),
                vacancyCount: value
            }

            workDatetime.setTime(workDatetime.getTime() + 1 * 86400000);
            return obj;
        }
    });

    vacancyInfo = vacancyInfo.concat(result);

    vacancyInfo = vacancyInfo.filter(item => item !== undefined && item.vacancyCount > 0);

    return vacancyInfo
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    const page = await browser.newPage();
    await page.goto('https://www.net.city.nagoya.jp/cgi-bin/sp05001'); // 表示したいURL

    console.log("名古屋体育館検索処理開始");

    // 種目をバレーボールに選択
    page.select('select[name="syumoku"]', '025');

    // リロードがかかるので少し待つ
    // await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });
    await page.waitFor(1000)

    const gymInfo = []

    // バレーボールが使える施設一覧を取得する
    let listSelector = 'select[name="sisetu"] > option';
    let sportsHall = await page.$$eval(listSelector, list => {
        return list.map(data => {
            return {
                value: data.value,
                name: data.innerHTML
            }
        });
    });

    // 未選択のデータを除去
    sportsHall = sportsHall.filter(item => item.value != "0000");

    // 体育館ごとの空き情報の抽出
    for (let hall of sportsHall) {

        // 体育館を選択
        await page.select('select[name="sisetu"]', hall.value);

        tempGymInfo = {}

        // 今日の日付を選択
        const currentDateTime = new Date();
        const month = currentDateTime.toFormat("MM");
        const day = currentDateTime.toFormat("DD");

        await page.select('select[name="month"]', month);
        await page.select('select[name="day"]', day);

        // 検索処理
        page.click('input[name=B1]');
        await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

        let isExistNext = true
        let vacancyInfo = []

        while (isExistNext) {

            // 検索結果の情報を収集する
            let listSelector = '.AKITABLE > tbody > tr > td';

            var searchResult = await page.$$eval(listSelector, list => {
                return list.map(data => data.textContent);
            });

            vacancyInfo = vacancyInfo.concat(getVacancyInfo(currentDateTime, searchResult));

            currentDateTime.setTime(currentDateTime.getTime() + 14 * 86400000);

            isExistNext = false
            // input[name="afimage"]があり続ける限り繰り返す
            isExistNext = await page.$('input[class=sp025a]').then(res => !!res);

            if (isExistNext) {

                // 検索処理
                page.$eval('form[name=afpage]', form => form.submit());
                await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

                await page.screenshot({
                    path: 'app/data/searchPage.png' // スクリーンショットを撮る
                });

            }

        }

        tempGymInfo.sportsHall = hall.name
        tempGymInfo.vacancyInfo = vacancyInfo

        gymInfo.push(tempGymInfo)

        // 検索画面に遷移する
        await page.goto('https://www.net.city.nagoya.jp/cgi-bin/sp05001'); // 表示したいURL

        // 種目をバレーボールに選択
        page.select('select[name="syumoku"]', '025');
        await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

        // リロードがかかるので少し待つ
        await page.waitFor(1000)

    }

    let notifyMessage = '現在のスポーツセンターの空き状況です。\n\n'

    gymInfo.forEach(function (gymInfoValue) {

        if (gymInfoValue.vacancyInfo.length > 0) {
            notifyMessage = notifyMessage + gymInfoValue.sportsHall + "\n\n"

            gymInfoValue.vacancyInfo.forEach(function (vacancyInfoValue) {
                notifyMessage = notifyMessage + vacancyInfoValue.date + " " + vacancyInfoValue.vacancyCount + "室が空いています。\n\n"
            })

            notifyMessage = notifyMessage + "\n\n"
        }
    });

    // ラインに通知する
    let config = {
        baseURL: BASE_URL,
        url: PATH,
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${LINE_TOKEN}`
        },
        data: qs.stringify({
            message: notifyMessage,
        })
    };

    axios.request(config)
        .then((res) => {
            console.log(res.status);
        })
        .catch((error) => {
            console.log(error);
        });

    browser.close();

})()
.catch(e => console.error(e));