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
const LOGIN_ID = process.env.LOGIN_ID;
const PASSWORD = process.env.PASSWORD;
const RYOTA_LOGIN_ID = process.env.RYOTA_LOGIN_ID;
const RYOTA_PASSWORD = process.env.RYOTA_PASSWORD;

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

    console.log(tempVacancyInfo);
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

function lineNotifyMessage(message) {
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
            message: message,
        })
    };

    axios.request(config)
        .then((res) => {
            console.log(res.status);
        })
        .catch((error) => {
            console.log(error);
        });
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

    // 片桐のフットサルページ更新
    await page.goto('https://www.net-menber.com/account_login/login'); // 表示したいURL

    await page.type("#LoginEmail", RYOTA_LOGIN_ID);
    await page.type("#LoginPass", RYOTA_PASSWORD);
    page.click('.btn1');
    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

    page.click('a[href="/account_team/mod?id=119057"]');
    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

    page.click('.next');
    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

    page.click('a[href="/account_login/logout"]');
    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

    // ゆるスポの更新
    await page.goto('https://www.net-menber.com/account_login/login'); // 表示したいURL

    await page.type("#LoginEmail", LOGIN_ID);
    await page.type("#LoginPass", PASSWORD);
    page.click('.btn1');
    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

    page.click('a[href="/account_team/mod?id=66103"]');
    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

    page.click('.next');
    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

    await page.goto('https://www.net-menber.com/mypage');

    page.click('a[href="/account_team/mod?id=137497"]');
    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

    page.click('.next');
    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

    // 名古屋SCの検索
    const searchDateTime = new Date();
    if ("08" <= searchDateTime.toFormat("HH24") && "23" >= searchDateTime.toFormat("HH24")) {
        lineNotifyMessage('\n\n現在のスポーツセンターの空き状況検索を開始します...')
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

            // 今日の日付を選択
            const currentDateTime = new Date();
            const month = currentDateTime.toFormat("MM");
            const day = currentDateTime.toFormat("DD");

            console.log("month:" + month);
            console.log("day:" + day);
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

                if(searchResult.length > 0){
                    vacancyInfo = vacancyInfo.concat(getVacancyInfo(currentDateTime, searchResult));
                }
                currentDateTime.setTime(currentDateTime.getTime() + 14 * 86400000);

                isExistNext = false
                // input[name="afimage"]があり続ける限り繰り返す
                isExistNext = await page.$('input[class=sp025a]').then(res => !!res);

                if (isExistNext) {
                    // 検索処理
                    page.$eval('form[name=afpage]', form => form.submit());
                    await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });
                }

            }

            if (vacancyInfo.length > 0) {
                let notifyMessage = "\n\n" + hall.name + "\n\n"

                vacancyInfo.forEach(function (vacancyInfoValue) {
                    notifyMessage = notifyMessage + vacancyInfoValue.date + " " + vacancyInfoValue.vacancyCount + "室が空いています。\n\n"
                })
                lineNotifyMessage(notifyMessage)
            }

            // 検索画面に遷移する
            await page.goto('https://www.net.city.nagoya.jp/cgi-bin/sp05001'); // 表示したいURL

            // 種目をバレーボールに選択
            page.select('select[name="syumoku"]', '025');
            await page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" });

            // リロードがかかるので少し待つ
            await page.waitFor(1000)

        }

        lineNotifyMessage('\n\n現在のスポーツセンターの空き状況検索を終了します...')
    }

    browser.close();

})()
    .catch(e => console.error(e));