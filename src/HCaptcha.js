const fetch = require("node-fetch")
const chrome = require('selenium-webdriver/chrome');
const webdriver = require('selenium-webdriver');
const {Builder} = require('selenium-webdriver');

module.exports = class HCaptchaSolver{
    
    constructor(API_KEY,USER_AGENT,SITE_KEY,SITE_URL,ENABLE_LOGGER,LOGGER_FUNCTION){
        
        this.key = API_KEY
        this.userAgent = USER_AGENT
        this.siteurl = SITE_URL
        this.sitekey = SITE_KEY
        this.initialized = false
        this.httpHeaders = { apikey:API_KEY }
        this.hsw = null
        this.isLoggingEnabled = ENABLE_LOGGER || false,
        this.logFunction = LOGGER_FUNCTION
        this.initPromise = this.init();
    }
    get remainingSolves(){
        return this.solveLimit - this.usedSolves
    }
    async init(){
        if(this.initialized) 
            return
        else if(this.initPromise)
            return this.initPromise

        await this._log("PROCESSING","Initializing HCaptcha Solver...")
        let { plan, endpoint } = await fetch("https://manage.nocaptchaai.com/api/user/get_endpoint",{headers:this.httpHeaders}).then(res => res.json())
        this.keyType = plan == "paid" ? "pro":"free"
        this.solveEndpoint = endpoint
        this.balanceEndpoint = this.keyType == "free" ? "https://free.nocaptchaai.com/api/user/free_balance":"https://manage.nocaptchaai.com/api/user/get_balance"

        await Promise.all([
            fetch(this.balanceEndpoint,{headers:this.httpHeaders})
                .then(res => res.json())
                .then(({ dailyLimit, used }) => {
                    this.solveLimit = dailyLimit || 100
                    this.usedSolves = used || 0
                }),
            fetch("https://hcaptcha.com/1/api.js?render=explicit&onload=hcaptchaOnLoad",
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
            })
                .then(res => res.text())
                .then(text => {
                    this.hcaptchaVersion = text.split("assetUrl")[1].split("https://newassets.hcaptcha.com/captcha/v1/")[1].split("/static")[0]
                })
        ])

        this.initialized = true
        await this._log("DONE","HCaptcha Solver Initialized Successfully")
    }
    async solve(rqdata){
        if(!this.initialized){
            this.initPromise = this.init()
            await this.initPromise
        }
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
        let m = `{"st":1664216025433,"md":[[26,52,1664216027088]],"md-mp":0,"mu":[[26,52,1664216027194]],"mu-mp":0,"v":1,"topLevel":{"st":1664216023027,"sc":{"availWidth":1280,"availHeight":1024,"width":1280,"height":1024,"colorDepth":24,"pixelDepth":24,"availLeft":0,"availTop":0,"onchange":null,"isExtended":false},"nv":{"vendorSub":"","productSub":"20030107","vendor":"Google Inc.","maxTouchPoints":0,"scheduling":{},"userActivation":{},"doNotTrack":null,"geolocation":{},"connection":{},"pdfViewerEnabled":true,"webkitTemporaryStorage":{},"webkitPersistentStorage":{},"hardwareConcurrency":2,"cookieEnabled":true,"appCodeName":"Mozilla","appName":"Netscape","appVersion":"${this.userAgent}","platform":"Win32","product":"Gecko","userAgent":"${this.userAgent}","language":"en-US","languages":["en-US"],"onLine":true,"webdriver":false,"bluetooth":{},"clipboard":{},"credentials":{},"keyboard":{},"managed":{},"mediaDevices":{},"storage":{},"serviceWorker":{},"wakeLock":{},"deviceMemory":2,"ink":{},"hid":{},"locks":{},"mediaCapabilities":{},"mediaSession":{},"permissions":{},"presentation":{},"serial":{},"virtualKeyboard":{},"usb":{},"xr":{},"userAgentData":{"brands":[],"mobile":false,"platform":""},"plugins":["internal-pdf-viewer","internal-pdf-viewer","internal-pdf-viewer","internal-pdf-viewer","internal-pdf-viewer"]},"dr":"","inv":false,"exec":false,"wn":[[1652,1228,0.75,1664216023029]],"wn-mp":0,"xy":[[0,0,1,1664216023029]],"xy-mp":0,"mm":[[760,768,1664216023298],[760,765,1664216023314],[760,762,1664216023330],[758,762,1664216023618],[757,761,1664216023634],[753,761,1664216023650],[749,758,1664216023666],[745,757,1664216023682],[740,756,1664216023698]],"mm-mp":29.142857142857142},"session":[],"widgetList":["${widgetid}"],"widgetId":"${widgetid}","href":"https://discord.com/register","prev":{"escaped":false,"passed":false,"expiredChallenge":false,"expiredResponse":false}}`
        m = m.replace(/1664216/g, Math.round(Date.now()).toString().slice(0,7))
        
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

        // let postImages = await fetch(`https://${this.keyType}.nocaptchaai.com/api/solve`,
        let postImages = await fetch(this.solveEndpoint,
        {
            method:"POST",
            headers:{
                "Content-type": "application/json",
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
                    await sleep(2000)
                }else {
                    recognizedImages = result.solution
                }
            }
            
        }else {
            recognizedImages = postImages.solution
        }
        
        for(let i = 0;i < tasklist.length;i++){
            answers[tasklist[i].task_key] = recognizedImages.includes(Number(i)) ? "true":"false"
        }
        await this._log("DONE","Images Retrieved!")
    
        return {status:1,answers}
    }

    async _postCaptcha(captcha,answers){
        
        await this._log("PROCESSING","Generating The Payload To Send With Submit Request To hcaptcha.com...")
        let m = "{\"st\":1664216029570,\"dct\":1664216029571,\"mm\":[[2,309,1664216030707],[2,308,1664216030757],[4,308,1664216031092],[6,308,1664216031114],[8,308,1664216031170],[16,304,1664216031186],[33,284,1664216031202],[48,258,1664216031218],[60,240,1664216031234],[72,222,1664216031250],[85,210,1664216031266],[92,202,1664216031282],[100,196,1664216031298],[104,192,1664216031314],[109,190,1664216031330],[112,188,1664216031346],[113,186,1664216031658],[124,182,1664216031682],[134,180,1664216031698],[142,177,1664216031714],[149,176,1664216031730],[152,176,1664216031746],[153,176,1664216031906],[154,176,1664216031922],[157,176,1664216031938],[158,176,1664216031954],[161,176,1664216031970],[162,177,1664216031986],[166,178,1664216032002],[169,180,1664216032018],[172,180,1664216032034],[174,182,1664216032050],[178,182,1664216032066],[182,184,1664216032082],[188,189,1664216032098],[194,192,1664216032114],[201,197,1664216032130],[208,200,1664216032146],[216,201,1664216032162],[228,205,1664216032178],[234,208,1664216032194],[237,209,1664216032210],[238,209,1664216032306],[241,209,1664216032322],[245,209,1664216032338],[250,212,1664216032354],[257,216,1664216032370],[262,217,1664216032386],[268,221,1664216032402],[273,226,1664216032418],[276,230,1664216032434],[277,236,1664216032457],[278,238,1664216032506],[280,245,1664216032522],[281,254,1664216032538],[282,262,1664216032554],[285,273,1664216032578],[286,278,1664216032594],[286,284,1664216032610],[286,286,1664216032650],[286,292,1664216032666],[286,304,1664216032682],[286,312,1664216032698],[285,320,1664216032714],[282,328,1664216032730],[280,340,1664216032746],[276,346,1664216032762],[276,353,1664216032778],[273,362,1664216032794],[270,368,1664216032810],[269,373,1664216032826],[266,377,1664216032843],[258,389,1664216032866],[249,401,1664216032882],[240,416,1664216032898],[232,432,1664216032914],[228,441,1664216032930],[226,448,1664216032946],[226,454,1664216032964],[230,464,1664216032985],[238,472,1664216033002],[250,480,1664216033026],[258,488,1664216033043],[268,496,1664216033066],[270,498,1664216033082],[273,502,1664216033098],[277,508,1664216033114],[284,512,1664216033130],[294,513,1664216033146],[305,513,1664216033162],[314,513,1664216033178],[321,513,1664216033194],[326,513,1664216033210],[333,513,1664216033226],[336,513,1664216033242],[333,510,1664216033314],[304,504,1664216033330],[274,497,1664216033346],[250,489,1664216033362],[226,481,1664216033378],[208,473,1664216033394],[197,468,1664216033410],[188,464,1664216033426],[177,452,1664216033443],[170,441,1664216033482],[160,432,1664216033498],[140,413,1664216033514],[124,400,1664216033530],[113,393,1664216033546],[106,385,1664216033563],[101,380,1664216033586],[98,376,1664216033610],[94,374,1664216033634],[92,373,1664216033699],[84,365,1664216033722],[80,361,1664216033738],[77,357,1664216033811],[74,353,1664216033827],[70,350,1664216033843],[69,349,1664216033860],[66,346,1664216033882],[65,345,1664216033898],[65,350,1664216034210],[68,370,1664216034226],[69,394,1664216034243],[69,421,1664216034259],[64,456,1664216034282],[58,468,1664216034298],[58,469,1664216034370],[58,470,1664216034386],[58,472,1664216034402],[57,476,1664216034418],[57,477,1664216034618],[68,477,1664216034642],[70,477,1664216034659],[73,477,1664216034682],[74,477,1664216035218],[78,477,1664216035234],[86,477,1664216035258],[92,477,1664216035274],[98,476,1664216035298],[102,474,1664216035322],[110,473,1664216035346],[120,473,1664216035362],[130,473,1664216035378],[149,472,1664216035394],[169,468,1664216035410],[188,465,1664216035426],[204,465,1664216035442],[220,465,1664216035459],[230,465,1664216035483],[234,465,1664216035554],[240,465,1664216035570],[246,468,1664216035594],[253,469,1664216035610],[265,472,1664216035626],[281,474,1664216035642],[294,476,1664216035658],[297,476,1664216035674],[297,472,1664216035802],[280,445,1664216035818],[258,418,1664216035834],[249,406,1664216035859],[249,404,1664216035898],[249,401,1664216035914],[246,396,1664216035930],[242,388,1664216035946],[241,381,1664216035962],[240,378,1664216035979],[240,376,1664216036122],[238,373,1664216036138],[234,369,1664216036154],[229,362,1664216036178],[224,358,1664216036194],[221,353,1664216036210],[217,350,1664216036234],[217,349,1664216036258],[216,353,1664216036898],[220,368,1664216036914],[222,382,1664216036930],[226,396,1664216036946],[230,409,1664216036962],[234,418,1664216036978],[236,421,1664216036994],[236,424,1664216037074],[241,434,1664216037098],[245,444,1664216037114],[252,457,1664216037130],[258,473,1664216037146],[265,484,1664216037162],[269,493,1664216037178],[272,497,1664216037194],[274,501,1664216037210],[274,504,1664216037282],[280,509,1664216037298],[290,517,1664216037314],[309,522,1664216037330],[328,530,1664216037346],[344,537,1664216037362],[353,541,1664216037378],[356,542,1664216037394],[356,545,1664216037642],[356,549,1664216037658],[356,557,1664216037674],[354,564,1664216037690],[352,569,1664216037722]],\"mm-mp\":16.86298076923078,\"md\":[[65,345,1664216033973],[73,477,1664216034700],[216,349,1664216036387],[352,569,1664216038043]],\"md-mp\":1356.6666666666667,\"mu\":[[65,345,1664216034074],[73,477,1664216034828],[216,349,1664216036515],[352,569,1664216038162]],\"mu-mp\":1362.6666666666667,\"topLevel\":{\"st\":1664216023027,\"sc\":{\"availWidth\":1280,\"availHeight\":1024,\"width\":1280,\"height\":1024,\"colorDepth\":24,\"pixelDepth\":24,\"availLeft\":0,\"availTop\":0,\"onchange\":null,\"isExtended\":false},\"nv\":{\"vendorSub\":\"\",\"productSub\":\"20030107\",\"vendor\":\"Google Inc.\",\"maxTouchPoints\":0,\"scheduling\":{},\"userActivation\":{},\"doNotTrack\":null,\"geolocation\":{},\"connection\":{},\"pdfViewerEnabled\":true,\"webkitTemporaryStorage\":{},\"webkitPersistentStorage\":{},\"hardwareConcurrency\":2,\"cookieEnabled\":true,\"appCodeName\":\"Mozilla\",\"appName\":\"Netscape\",\"appVersion\":\"user_agent\",\"platform\":\"Win32\",\"product\":\"Gecko\",\"userAgent\":\"user_agent\",\"language\":\"en-US\",\"languages\":[\"en-US\"],\"onLine\":true,\"webdriver\":false,\"bluetooth\":{},\"clipboard\":{},\"credentials\":{},\"keyboard\":{},\"managed\":{},\"mediaDevices\":{},\"storage\":{},\"serviceWorker\":{},\"wakeLock\":{},\"deviceMemory\":2,\"ink\":{},\"hid\":{},\"locks\":{},\"mediaCapabilities\":{},\"mediaSession\":{},\"permissions\":{},\"presentation\":{},\"serial\":{},\"virtualKeyboard\":{},\"usb\":{},\"xr\":{},\"userAgentData\":{\"brands\":[],\"mobile\":false,\"platform\":\"\"},\"plugins\":[\"internal-pdf-viewer\",\"internal-pdf-viewer\",\"internal-pdf-viewer\",\"internal-pdf-viewer\",\"internal-pdf-viewer\"]},\"dr\":\"\",\"inv\":false,\"exec\":false,\"wn\":[],\"wn-mp\":0,\"xy\":[],\"xy-mp\":0,\"mm\":[[760,768,1664216023298],[760,765,1664216023314],[760,762,1664216023330],[758,762,1664216023618],[757,761,1664216023634],[753,761,1664216023650],[749,758,1664216023666],[745,757,1664216023682],[740,756,1664216023698],[701,732,1664216028274],[697,756,1664216028307],[697,757,1664216028323],[697,758,1664216028370],[697,768,1664216028386],[697,781,1664216028402],[698,782,1664216028570],[704,782,1664216028586],[706,780,1664216028602],[708,778,1664216029002],[697,757,1664216030138],[686,741,1664216030154],[684,736,1664216030178],[684,730,1664216030214],[682,730,1664216030236],[682,729,1664216030387],[684,729,1664216030403],[694,729,1664216030429],[697,729,1664216030452],[700,729,1664216030475],[702,729,1664216030504],[717,732,1664216030532],[732,732,1664216030549]],\"mm-mp\":120.94999999999999},\"v\":1}"
        let motionData = m.replace(/1664216/g, Math.round(Date.now()).toString().slice(0,7)).replace("user_agent",this.userAgent)
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
