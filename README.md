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
const {NoCaptchaSolver} = require("nocaptchasolver")

const Solver = new NoCaptchaSolver(UID,API_KEY,USER_AGENT,SITE_KEY,SITE_URL)

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

<h2>Examples</h2>

```js
const {NoCaptchaSolver} = require("nocaptchasolver")

const Solver = new NoCaptchaSolver("ccbf7ee84db748a2b4aad654112da128","free-api-b0ec566e....","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36","a9b5fb07-92ff-493f-86fe-352a2803b3df","discord.com")

async function main()
{ 
   if(Solver.remainingSolves === 0) return
   let solvedCaptcha = Solver.solve()
   console.log(solvedCaptcha)
}

main() // { status:1,key:"F0_ey......" }
```