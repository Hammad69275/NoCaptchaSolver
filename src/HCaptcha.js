const fetchSync = require("sync-fetch")
const fetch = require("node-fetch")
const chrome = require('selenium-webdriver/chrome');
const webdriver = require('selenium-webdriver');
const {Builder} = require('selenium-webdriver');

module.exports = class HCaptchaSolver{
    
    constructor(UID,API_KEY,USER_AGENT,SITE_KEY,SITE_URL,ENABLE_LOGGER,LOGGER_FUNCTION){
        
        this.uid = UID
        this.key = API_KEY
        this.userAgent = USER_AGENT
        this.siteurl = SITE_URL
        this.sitekey = SITE_KEY
        this.solveLimit = fetchSync(`https://free.nocaptchaai.com/api/account/balance`,{headers:{ uid:UID,apikey:API_KEY }}).json().limit || 100
        this.keyType = fetchSync(`https://free.nocaptchaai.com/api/account/balance`,{headers:{ uid:UID,apikey:API_KEY }}).json().type == "paid" ? "pro":"free"
        this.usedSolves = fetchSync(`https://free.nocaptchaai.com/api/account/balance`,{headers:{ uid:UID,apikey:API_KEY }}).json().used || 0
        this.hcaptchaVersion = fetchSync("https://hcaptcha.com/1/api.js?render=explicit&onload=hcaptchaOnLoad",
        {
            headers:{
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
                "sec-fetch-dest": "script",
                "sec-ch-ua-platform": "Windows",
                "user-agent": this.userAgent,
                "referer": this.siteurl,
            }
        }
        ).text().split("assetUrl")[1].split("https://newassets.hcaptcha.com/captcha/v1/")[1].split("/static")[0]
        this.hsw
        this.isLoggingEnabled = ENABLE_LOGGER || false,
        this.logFunction = LOGGER_FUNCTION
    }
    get remainingSolves(){
        return this.solveLimit - this.usedSolves
    }
    async solve(rqdata){
        let captcha = await this._getCaptcha(rqdata)
        if(captcha.generated_pass_UUID) return {status:1,key:captcha.generated_pass_UUID}
        if(!captcha.key) return {status:0}
        let captcha_solution = await this._solveCaptcha(captcha)
        if(!captcha_solution.status) return captcha_solution
        let solvedCaptcha = await this._postCaptcha(captcha,captcha_solution.answers)
        return solvedCaptcha
    }
    async _log(type,message){
        if(!this.isLoggingEnabled) return
        if(this.logFunction){
            await this.logFunction(type,message)
        }else {
            console.log(`${type}${" ".repeat(type == "DONE" ? "PROCESSING".length-type.length:0)} | ${message}`)
        }
    }
    async _getCaptcha(rqdata){
        
        await this._log("PROCESSING","Requesting Captcha Challenge From hcaptcha.com...")
        let reqdata = await fetch(`https://hcaptcha.com/checksiteconfig?v=${this.hcaptchaVersion}&host=${this.siteurl}&sitekey=${this.sitekey}&sc=1&swa=1`,{
            method:"POST",
            headers:{
                "accept": "application/json",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "text/plain",
                "accept-encoding": "gzip, deflate, br",
                "origin": "https://newassets.hcaptcha.com",
                "referer": "https://newassets.hcaptcha.com/",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "Windows",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "user-agent": this.userAgent,
            }
        })
        reqdata = await reqdata.json()
        await this._log("PROCESSING","Generating n Value")
        
        let hsw = await fetch(JSON.parse(Buffer.from(reqdata.c.req.split(".")[1],"base64").toString())["l"]+`/hsw.js`,{
            headers:{
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
                "referer": `https://newassets.hcaptcha.com/captcha/v1/${this.hcaptchaVersion}/static/hcaptcha.html`,
                "user-agent": this.userAgent,
            }
        })
        hsw = await hsw.text()
        hsw = hsw.split("var hsw=")[1]
        this.hsw = hsw

        let widgetid = makeWidgetId(12)
        let m = `{"st":1661663397717,"mm":[[2,19,1661663398690],[19,24,1661663398706],[31,26,1661663398722],[39,29,1661663398745],[40,28,1661663398833]],"mm-mp":17.875,"md":[[40,28,1661663399130]],"md-mp":0,"mu":[[40,28,1661663399201]],"mu-mp":0,"v":1,"topLevel":{"inv":false,"st":1661663397460,"sc":{"availWidth":1920,"availHeight":1032,"width":1920,"height":1080,"colorDepth":24,"pixelDepth":24,"availLeft":0,"availTop":0,"onchange":null,"isExtended":false},"nv":{"vendorSub":","productSub":"20030107","vendor":"NAVER Corp.","maxTouchPoints":0,"scheduling":{},"userActivation":{},"doNotTrack":null,"geolocation":{},"connection":{},"pdfViewerEnabled":true,"webkitTemporaryStorage":{},"webkitPersistentStorage":{},"hardwareConcurrency":4,"cookieEnabled":true,"appCodeName":"Mozilla","appName":"Netscape","appVersion":"${this.userAgent}","platform":"Win32","product":"Gecko","userAgent":"${this.userAgent}}","language":"en-US","languages":["en-US"],"onLine":true,"webdriver":false,"bluetooth":{},"clipboard":{},"credentials":{},"keyboard":{},"managed":{},"mediaDevices":{},"storage":{},"serviceWorker":{},"wakeLock":{},"deviceMemory":8,"ink":{},"hid":{},"locks":{},"mediaCapabilities":{},"mediaSession":{},"permissions":{},"presentation":{},"serial":{},"virtualKeyboard":{},"usb":{},"xr":{},"userAgentData":{"brands":[{"brand":"Whale","version":"3"},{"brand":" Not;A Brand","version":"99"},{"brand":"Chromium","version":"104"}],"mobile":false,"platform":"Windows"},"plugins":["internal-pdf-viewer","internal-pdf-viewer","internal-pdf-viewer","internal-pdf-viewer","internal-pdf-viewer"]},"dr":","exec":false,"wn":[[1186,964,1,1661663397465]],"wn-mp":0,"xy":[[0,0,1,1661663397478]],"xy-mp":0,"mm":[[952,0,1661663398099],[912,0,1661663398121],[890,2,1661663398137],[868,7,1661663398154],[826,20,1661663398177],[794,29,1661663398193],[760,39,1661663398213],[713,53,1661663398234],[225,279,1661663398621],[239,291,1661663398641],[250,297,1661663398657],[264,304,1661663398673]],"mm-mp":22.384615384615383},"session":[],"widgetList":["${widgetid}"],"widgetId":"${widgetid}","href":"${this.siteurl}","prev":{"escaped":false,"passed":false,"expiredChallenge":false,"expiredResponse":false}}`
        m = m.replace(/1661663/g, Math.round(Date.now()).toString().slice(0,7))
        let n = await this._getN(reqdata.c.req)

        await this._log("DONE","n Value Generated!")
        await this._log("PROCESSING","Sending Payload to hcaptcha.com With The Generated n Value!")

        let payload = {
            "v": this.hcaptchaVersion,
            "sitekey": this.sitekey,
            "host": this.siteurl,
            "hl": "en",
            "motionData": m,
            "n": n,
            "c": JSON.stringify(reqdata.c)
        }
        
        if(rqdata) payload.rqdata = rqdata

        payload = serialize(payload)

        let captcha_data = await fetch(`https://hcaptcha.com/getcaptcha/${this.sitekey}`,
            {
                method:"POST",
                headers:{
                    "accept": "application/json",
                    "accept-encoding": "gzip, deflate, br",
                    "accept-language": "en-US,en;q=0.9",
                    "origin": "https://newassets.hcaptcha.com",
                    "referer": "https://newassets.hcaptcha.com/",
                    "content-type": "application/x-www-form-urlencoded",
                    "user-agent": this.userAgent,
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site"
               },
               body:payload
            }
        )
        await this._log("DONE","Captcha Challenge Received!")
        return captcha_data.json()
    }
    
    async _solveCaptcha(captcha){
        
        await this._log("PROCESSING","Checking nocaptchaai Account Balance..")

        if(this.usedSolves == this.solveLimit) {
            await this._log("DONE","Not Enough Balance To Solve Captcha. Session Terminated!")
            if(this.keyType === "free") return {status:0,message:"Your Free Plan Has Reached Its Limit. Please Contact ai@nocaptchaai.com For A Paid Plan"}
            else return {status:0,message:"Your Paid Plan Has Reached Its Limit. Please Buy Another Plan To Continue Solving Captchas"}
            
        }
        await this._log("PROCESSING","Submitting Images To nocaptchaai For Recognition...")
        let {key,tasklist,requester_question} = captcha
        let images = {}
        let answers = {}

        for(let i=0;i<tasklist.length;i++){
            let image = await fetch(tasklist[i].datapoint_uri)
            let base64image = Buffer.from(await image.arrayBuffer()).toString('base64');
            images[i] = base64image
        }

        let payload = {
            images,
            method:"hcaptcha_base64",
            target:requester_question["en"],
            site:this.siteurl,
            sitekey:this.sitekey
        }

        let recognizedImages

        let postImages = await fetch(`https://${this.keyType}.nocaptchaai.com/api/solve`,
        {
            method:"POST",
            headers:{
                "Content-type": "application/json",
                uid:this.uid,
                apikey:this.key
            },
            body:JSON.stringify(payload)
        }
        )
        postImages = await postImages.json()

        if(!postImages.url && !(postImages.status == "solved")) {
            await this._log("DONE","Unable To Submit Images For Recognition")
            return {status:0,message:"Unable To Submit Images For Recognition"}
        }
        this.usedSolves++
	    if(!(postImages.status == "solved")){
            
            while(!recognizedImages){
                let result = await fetch(postImages.url)
                result = await result.json()
                if(!(result.status == "solved")){
                    sleep(2000)
                }else {
                    recognizedImages = result.solution
                }
            }

        }else recognizedImages = postImages.solution
        
        for(let i = 0;i < tasklist.length;i++){
            answers[tasklist[i].task_key] = recognizedImages.includes(i.toString()) ? "true":"false"
        }
        await this._log("DONE","Images Retrieved!")
    
        return {status:1,answers}
    }

    async _postCaptcha(captcha,answers){
        
        await this._log("PROCESSING","Generating The Payload To Send With Submit Request To hcaptcha.com...")

        let m = "{\"st\":1663366671488,\"dct\":1663366671488,\"mm\":[[9,276,1663366674194],[34,264,1663366674215],[36,262,1663366674264],[38,261,1663366674287],[38,260,1663366674423],[38,257,1663366674441],[40,250,1663366674457],[44,230,1663366674479],[45,218,1663366674497],[46,198,1663366674519],[48,192,1663366674535],[48,185,1663366674551],[48,180,1663366674567],[48,177,1663366674584],[49,177,1663366674911],[61,178,1663366674927],[92,184,1663366674943],[136,184,1663366674960],[189,184,1663366674984],[200,184,1663366675007],[198,184,1663366675767],[186,188,1663366675783],[178,190,1663366675799],[174,193,1663366675815],[166,193,1663366675831],[158,193,1663366675847],[153,193,1663366675864],[142,192,1663366675889],[137,192,1663366675911],[134,192,1663366675927],[130,192,1663366675943],[128,192,1663366675959],[121,192,1663366675975],[117,192,1663366675991],[109,196,1663366676007],[102,198,1663366676023],[96,200,1663366676040],[88,200,1663366676063],[85,202,1663366676079],[84,202,1663366676096],[88,202,1663366676432],[140,205,1663366676455],[180,205,1663366676473],[212,205,1663366676495],[232,205,1663366676511],[258,198,1663366676527],[288,190,1663366676543],[316,186,1663366676559],[352,186,1663366676575],[378,186,1663366676591],[386,186,1663366676607],[386,186,1663366676896],[376,189,1663366676919],[372,189,1663366676935],[366,190,1663366676951],[362,192,1663366676967],[354,194,1663366676983],[348,197,1663366676999],[342,198,1663366677015],[338,200,1663366677031],[337,202,1663366677312],[336,218,1663366677328],[334,233,1663366677344],[334,246,1663366677367],[334,254,1663366677383],[334,262,1663366677399],[334,268,1663366677415],[334,269,1663366677431],[334,270,1663366677463],[334,272,1663366677479],[334,273,1663366677744],[334,278,1663366677767],[334,284,1663366677786],[333,294,1663366677807],[333,302,1663366677823],[333,309,1663366677839],[333,314,1663366678297],[333,348,1663366678319],[334,374,1663366678335],[334,396,1663366678353],[334,405,1663366678375],[334,406,1663366678536],[334,408,1663366678552],[334,409,1663366679024],[336,436,1663366679047],[340,472,1663366679063],[340,500,1663366679079],[341,518,1663366679095],[344,524,1663366679111],[345,528,1663366679127],[345,530,1663366679143],[346,530,1663366679399],[346,534,1663366679415],[346,538,1663366679432],[346,542,1663366679672],[346,549,1663366679695],[346,553,1663366679711],[346,554,1663366679730],[346,556,1663366679775],[346,557,1663366679791],[346,558,1663366679895],[346,560,1663366679912],[346,558,1663366680278],[336,533,1663366680295],[330,522,1663366680311],[328,517,1663366680327],[325,509,1663366680343],[325,504,1663366680359],[325,488,1663366680375],[324,460,1663366680391],[313,428,1663366680407],[298,397,1663366680423],[286,381,1663366680439],[268,365,1663366680455],[254,353,1663366680471],[250,349,1663366680488],[248,346,1663366680535],[236,332,1663366680551],[218,309,1663366680567],[204,284,1663366680583],[193,260,1663366680599],[189,246,1663366680615],[189,237,1663366680631],[189,232,1663366680647],[189,222,1663366680663],[194,205,1663366680679],[201,186,1663366680695],[212,165,1663366680711],[226,144,1663366680727],[238,128,1663366680743],[250,113,1663366680759],[265,97,1663366680775],[273,88,1663366680791],[278,85,1663366680847],[285,85,1663366680864],[293,86,1663366680881],[305,94,1663366680917],[314,100,1663366680936],[341,110,1663366680959],[358,121,1663366680975],[373,132,1663366680992],[384,138,1663366681015],[386,142,1663366681031],[386,144,1663366681111],[385,145,1663366681424],[376,148,1663366681447],[370,150,1663366681463],[366,150,1663366681481],[362,150,1663366681592],[346,154,1663366681615],[332,154,1663366681631],[316,154,1663366681647],[294,154,1663366681663],[272,154,1663366681679],[253,154,1663366681695],[237,156,1663366681711],[225,157,1663366681727],[216,160,1663366681743],[205,165,1663366681759],[194,168,1663366681775],[188,168,1663366681791],[184,170,1663366681807],[180,170,1663366681823],[178,172,1663366681840],[178,174,1663366682136],[178,188,1663366682159],[180,197,1663366682175],[181,201,1663366682192],[182,204,1663366682223],[182,209,1663366682239],[182,229,1663366682255],[182,257,1663366682271],[180,277,1663366682287],[178,282,1663366682303],[177,285,1663366682392],[177,296,1663366682415],[177,305,1663366682431],[177,317,1663366682447],[177,326,1663366682463],[177,336,1663366682481],[177,341,1663366682512],[177,342,1663366682543],[177,348,1663366682559],[174,358,1663366682575],[174,365,1663366682591],[174,372,1663366682607],[174,378,1663366682623],[174,385,1663366682639],[174,394,1663366682655],[176,406,1663366682671],[176,417,1663366682687],[176,420,1663366682703],[174,421,1663366683055],[166,421,1663366683071],[156,421,1663366683088],[140,422,1663366683112],[130,424,1663366683137],[122,425,1663366683159],[118,426,1663366683175],[116,428,1663366683191],[112,429,1663366683207],[108,430,1663366683223],[105,432,1663366683239],[97,433,1663366683255],[94,436,1663366683271],[89,437,1663366683287],[86,438,1663366683303],[85,438,1663366683320],[85,440,1663366683536],[92,441,1663366683559],[100,444,1663366683575],[106,445,1663366683591],[124,449,1663366683607],[146,453,1663366683623],[164,458,1663366683639],[177,464,1663366683655],[188,469,1663366683671],[193,472,1663366683727],[196,473,1663366683743],[201,477,1663366683759],[206,478,1663366683775],[213,482,1663366683791],[217,486,1663366683807],[222,490,1663366683823],[229,493,1663366683839],[233,496,1663366683855],[238,497,1663366683871],[241,500,1663366683887],[248,502,1663366683903],[252,504,1663366683920],[260,508,1663366683936],[272,516,1663366683952],[284,522,1663366683975],[286,525,1663366683991],[288,525,1663366684024],[289,526,1663366684040],[297,537,1663366684063],[302,546,1663366684079],[306,550,1663366684095],[308,550,1663366684352],[308,554,1663366684375],[309,556,1663366684431],[312,557,1663366684447],[316,561,1663366684463],[318,564,1663366684479],[318,565,1663366684543],[320,566,1663366684559],[321,566,1663366684631],[324,569,1663366684655]],\"mm-mp\":20.979959919839676,\"md\":[[200,184,1663366675341],[84,202,1663366676185],[337,200,1663366677073],[333,312,1663366678041],[334,408,1663366678755],[346,560,1663366680025],[386,144,1663366681217],[178,172,1663366681921],[176,421,1663366682865],[85,438,1663366683387],[325,570,1663366684745]],\"md-mp\":940.4,\"mu\":[[200,184,1663366675425],[84,202,1663366676265],[337,200,1663366677177],[333,312,1663366678145],[334,408,1663366678817],[346,560,1663366680105],[386,144,1663366681305],[178,172,1663366682033],[176,421,1663366682945],[85,438,1663366683465],[325,570,1663366684825]],\"mu-mp\":940,\"topLevel\":{\"st\":1663366641697,\"sc\":{\"availWidth\":1280,\"availHeight\":1024,\"width\":1280,\"height\":1024,\"colorDepth\":24,\"pixelDepth\":24,\"availLeft\":0,\"availTop\":0,\"onchange\":null,\"isExtended\":false},\"nv\":{\"vendorSub\":\"\",\"productSub\":\"20030107\",\"vendor\":\"GoogleInc.\",\"maxTouchPoints\":0,\"scheduling\":{},\"userActivation\":{},\"doNotTrack\":null,\"geolocation\":{},\"connection\":{},\"pdfViewerEnabled\":true,\"webkitTemporaryStorage\":{},\"webkitPersistentStorage\":{},\"hardwareConcurrency\":2,\"cookieEnabled\":true,\"appCodeName\":\"Mozilla\",\"appName\":\"Netscape\",\"appVersion\":\"5.0(WindowsNT10.0;Win64;x64)AppleWebKit/537.36(KHTML,likeGecko)Chrome/103.0.5060.134Safari/537.36\",\"platform\":\"Win32\",\"product\":\"Gecko\",\"userAgent\":\"user_agent\",\"language\":\"en-US\",\"languages\":[\"en-US\",\"en\"],\"onLine\":true,\"webdriver\":false,\"bluetooth\":{},\"clipboard\":{},\"credentials\":{},\"keyboard\":{},\"managed\":{},\"mediaDevices\":{},\"storage\":{},\"serviceWorker\":{},\"wakeLock\":{},\"deviceMemory\":2,\"ink\":{},\"hid\":{},\"locks\":{},\"mediaCapabilities\":{},\"mediaSession\":{},\"permissions\":{},\"presentation\":{},\"serial\":{},\"virtualKeyboard\":{},\"usb\":{},\"xr\":{},\"userAgentData\":{\"brands\":[],\"mobile\":false,\"platform\":\"Windows\"},\"plugins\":[\"internal-pdf-viewer\",\"internal-pdf-viewer\",\"internal-pdf-viewer\",\"internal-pdf-viewer\",\"internal-pdf-viewer\"]},\"dr\":\"\",\"inv\":false,\"exec\":false,\"wn\":[],\"wn-mp\":0,\"xy\":[],\"xy-mp\":0,\"mm\":[[698,756,1663366669849],[694,792,1663366669872],[692,806,1663366669889],[692,809,1663366670184],[692,793,1663366670200],[692,778,1663366670216],[692,768,1663366670232],[692,762,1663366670248],[692,757,1663366670264],[692,753,1663366670280],[692,749,1663366670297],[701,714,1663366673226],[698,714,1663366673248],[698,713,1663366674153],[718,700,1663366674176],[742,684,1663366674192]],\"mm-mp\":99.50381679389311,\"md\":[],\"md-mp\":0,\"mu\":[],\"mu-mp\":\"0\"},\"v\":1}"
      
        let motionData = m.replace(/1663366/g, Math.round(Date.now()).toString().slice(0,7)).replace("user_agent",this.userAgent)
        let n = await this._getN(captcha.c.req)

        let payload = JSON.stringify({
            "v": this.hcaptchaVersion,
            "job_mode": "image_label_binary",
            "answers":answers,
            "serverdomain": this.siteurl,
            "sitekey":this.sitekey,
            "motionData":motionData,
            "n":n,
            "c":JSON.stringify(captcha.c)
        })

        await this._log("DONE","Payload Generated. Sending Request To hcaptcha.com!")

        let submit = await fetch(`https://hcaptcha.com/checkcaptcha/${this.sitekey}/${captcha.key}`,{
            headers:{
                
                    "accept": "*/*",
                    "Authority": "hcaptcha.com",
                    "accept-encoding": "gzip, deflate, br",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type":"application/json;charset=utf-8",
                    "origin": "https://newassets.hcaptcha.com",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "referer": "https://newassets.hcaptcha.com/",
                    "user-agent": this.userAgent,
            },
            body:payload,
            method:"POST"
        })
        let submittedCaptcha = await submit.json()
        await this._log("DONE","Request Submitted Successfully!")
        if(submittedCaptcha.generated_pass_UUID) {
            await this._log("DONE",`Captcha Solution Generated Successfully ( ${submittedCaptcha.generated_pass_UUID.slice(0,10)+"..."} )`)
            return {status:1,key:submittedCaptcha.generated_pass_UUID}
        }
        else {
            await this._log("DONE",`Captcha Solution Failed Because It Was Solved Incorrectly`)
            return { status:0, message:"Captcha Was Solved Incorrectly" }
        }
    }
    async _getN(req){
        let hsv = this.hsw
        
        const driver = await new Builder()
        .withCapabilities({
        'goog:chromeOptions': {
           args:[
            "window-size=1,1",
            "--disable-blink-features=AutomationControlled",
            `user-agent=${this.userAgent}`,
            "--headless"
           ],
            excludeSwitches: [
                'enable-logging',
                ],
            },
        })
        .forBrowser(webdriver.Browser.CHROME)
        .build();

        await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        await driver.sendDevToolsCommand("Page.addScriptToEvaluateOnNewDocument", {"source":"const newProto = navigator.__proto__;delete newProto.webdriver;navigator.__proto__ = newProto;"})
        
        let script = `let hsw=${hsv} let tok = await hsw("${req}"); return tok`

        let n = await driver.executeScript(script)
        
        await driver.quit()

        return n
    }
}

function makeWidgetId(length) {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function serialize(obj, prefix) {
    var str = [],
      p;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p,
          v = obj[p];
        str.push((v !== null && typeof v === "object") ?
          serialize(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
  }
  
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeWidgetId(length) {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function serialize(obj, prefix) {
    var str = [],
      p;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p,
          v = obj[p];
        str.push((v !== null && typeof v === "object") ?
          serialize(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
  }
  
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}