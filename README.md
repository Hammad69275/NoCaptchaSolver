<h1 align="center"> 🤖 NoCaptchaSolver </h1>
<h3 align="center"> Solve HCaptcha Challenges With The Power Of NoCaptchaAI! </h3>

- Faster Than Most Of The Captcha Solving APIs
- Cheaper Than Most Of The Other APIs
- Fully Maintained

<h2>Installation</h2>

```npm install nocaptchasolver```

<h2>Usage</h2>

<h3>Instantiating The Wrapper</h3>

```js
const {HCaptchaSolver} = require("nocaptchasolver")

const Solver = new HCaptchaSolver(UID,API_KEY,USER_AGENT,SITE_KEY,SITE_URL,ENABLE_LOGGER,LOGGER_FUNCTION)

```

<h3>Solving Captcha</h3>
<p>After Instantiating The Wrapper, You Can Start Solving Captchas By Calling The solve() Method</p>

```js
await Solver.solve() // { status:1,key:P0_eyadwa... }
```

<h3>Invisible Captcha</h3>
<p>For Solving Invisible Captchas Like The Ones On Discord DMs, Pass In The rqdata Parameter</p>

```js
await Solver.solve(rqdata) // { status:1,key:P0.eadaea... }
```

<h3>Other Properties</h3>
<p>You Can Check Your NoCaptcha Account Balance With The remainingSolves Property</p>

```js
console.log(Solver.remainingSolves)
// 81
```

<p>You Can Also Check Your Account Limit With The solveLimit Property</p>

```js
console.log(Solver.solveLimit)
// 100
```
<h2>Logger</h2>

The Wrapper Has A Default Logger That You Can Enable By Passing The ENABLE_LOGGING Parameter As true
Moreover You Can Also Use Your Own Logger Function By Passing That Function As LOGGER_FUNCTION Parameter

Following Code Examples Demonstrate Their Working

<h3>Default Logger</h3>
<h4>Code</h4>

```js
const {HCaptchaSolver} = require("nocaptchasolver")

const solver = new HCaptchaSolver("ccbf7ee84db748a2b4aad654112da128","free-api-b0ec566e....","(Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36","a9b5fb07-92ff-493f-86fe-352a2803b3df","discord.com",true)

async function main(){
    let token = await solver.solve()
}
main()
```

<h4>Output</h4>

![Image](https://media.discordapp.net/attachments/1009809854157832286/1021407152461598730/image1.png?width=502&height=177)

<h3>Custom Logger With Terminal Kit</h3>
<h4>Code</h4>

```js
const {HCaptchaSolver} = require("nocaptchasolver")
const Terminal = require("terminal-kit").terminal

const logger = (type,message) => {
    Terminal(`[ ${type == "DONE" ? `^g${type + ` `.repeat("PROCESSING".length - type.length)}^` : `^r${type}^` } ] ${message}\n`)
}

const solver = new HCaptchaSolver("ccbf7ee84db748a2b4aad654112da128","free-api-b0ec566e....","(Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36","a9b5fb07-92ff-493f-86fe-352a2803b3df","discord.com",true,logger)

async function main(){
    let token = await solver.solve()
}
main()
```

<h4>Output</h4>

![Image](https://media.discordapp.net/attachments/1009809854157832286/1021407152901996604/image2.png?width=556&height=169)

<h2>Examples</h2>

```js
const {HCaptchaSolver} = require("nocaptchasolver")

const Solver = new HCaptchaSolver("ccbf7ee84db748a2b4aad654112da128","free-api-b0ec566e....","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36","a9b5fb07-92ff-493f-86fe-352a2803b3df","discord.com")

async function main()
{ 
   if(Solver.remainingSolves === 0) return
   let solvedCaptcha = await Solver.solve()
   console.log(solvedCaptcha)
}

main() // { status:1,key:"F0_ey......" }
```

<h2>API</h2>

Register on https://nocaptchaai.com/register and join their server to get the API Key and UID