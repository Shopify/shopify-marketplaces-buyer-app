<h1 align="center">Shopify Buyer-Facing Marketplace App</h1>

<p align="center">
  <a href="https://github.com/Shopify/shopify-marketplaces-buyer-app/releases">
    <img src="https://img.shields.io/github/issues/Shopify/shopify-marketplaces-buyer-app/total?style=for-the-badge&logo=Shopify">
  </a>
  <a href="https://github.com/Shopify/shopify-marketplaces-buyer-app/issues&color=brightgreen">
    <img src="https://img.shields.io/github/stars/Shopify/shopify-marketplaces-buyer-app?style=for-the-badge&logo=Shopify">
  </a>
</p>

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). It connects to the [`Shopify Merchant-Facing Channel App`](https://github.com/Shopify/shopify-marketplaces-admin-app) using [GraphQL](https://graphql.org/). It is an example of a simple buyer-side client application that can be used to get started quickly with marketplaces. The code in this repo comes directly from Marketplace Kit tutorials on [https://shopify.dev/marketplaces](https://shopify.dev/marketplaces) and be used as a springboard starting point for development of a buyer facing marketplace.

---

- [1. Getting Started](#1-getting-started)
- [2. Overview of Code Structure](#2-overview-of-code-structure)
- [3. How to use this repo (including tutorial links & files modified)](#3-how-to-use-this-repo)
- [4. Key Tech](#4-key-tech)
- [5. License](#5-license)

---

## 1. Getting Started

**Requirements:**

- [yarn](https://yarnpkg.com/en/) - Checkout [`this branch`](#) for npm-specific setup instructions 
- [`Setup the merchant-facing app`](https://github.com/Shopify/shopify-marketplaces-admin-app), this is where we get data to hydrate our client
- Ensure you have [NodeJS](https://nodejs.org/en/) installed on your system.

**Clone this repository:**

```bash
git clone https://github.com/Shopify/shopify-marketplaces-buyer-app
```

**Install dependencies:**

```bash
yarn
```

**Run local development server:**
```bash
yarn dev
```

**Change graphql uri:**

We connect to the merchant-facing-app to retrieve important information like shop name and storefront access token. To do this we connect to the merchant-facing-app graphql endpoint. By default this is set to `uri: http://localhost:8081/graphql` but you can change it to whatever port your merchant facing app is running on. To do this edit line 129 in /pages/cart/index.js line 129.


```js
const client = new ApolloClient({
    uri: `http://localhost:8081/graphql`,
    ...
});
```


**Open marketplace in browser:**

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
  


## 2. Overview of Code Structure

Familiarize yourself with the code structure for the buyer-facing app, to help you add all additional features that will be required, it is a great way to get started! It follows Next project conventions. 

<table>
  <caption>Code structure</caption>
  <tr>
    <th scope="col">Folder/file</th>
    <th scope="col">Contains</th>
  </tr>
  <tr>
    <td><code>pages/*</code></td>
    <td>

All the routes of your [`Next.js`](https://nextjs.org/docs/getting-started) application will be placed in this directory. 

</td>
</tr>
    <tr>
    <td><code>components/*</code></td>
    <td>Contains common React components that are used in multiple places in the app. </td>
  </tr>
  <tr>
    <td><code>public/*</code></td>
    <td>
    
[`Explained here`](https://nextjs.org/docs/basic-features/static-file-serving): Statically serve files like robots.txt and favicon.ico.  
    
</td>
  </tr>
  <tr>
    <td><code>styles/*</code></td>
    <td>CSS in this directory.</td>
  </tr>
  </tr>
  <tr>
    <td><code>.eslintrc.json</code></td>
    <td>Defines the configuration structure for ESLint as JSON.</td>
  </tr>
    <td><code>next.config.js</code></td>
    <td>Configuration file for your Next project.</td>
  </tr>
  <tr>
    <td><code>.gitignore</code></td>
    <td>Tells Git which files to ignore whe commiting to your project.</td>
  </tr>
  <tr>
    <td><code>package.json</code></td>
    <td>Records important metadata about a project, heart of Node project.</td>
  </tr>
  <tr>
    <td><code>yarn.lock</code></td>
    <td>Lockfile is generated according to the contents of package.json.</td>
  </tr>
</table>


## 3. How to use this repo
We have bundled up the code from our tutorials to help you get started building marketplaces quickly. You can use the code in this repo out-of-the-box but we highly recommend familiarizing yourself with the codebase and tutorials so you can have a full understanding of how it works. This will make it easier for you to modify and customize your marketplace.

Below is an ordered list of tutorials with the files affected.
<table>
  <caption>Tutorials</caption>
  <tr>
    <th scope="col">Tutorial URL</th>
    <th scope="col">Files Modified</th>
  </tr>
  <tr>
    <td>https://shopify.dev/marketplaces/shop-discovery</td>
    <td>pages/index.js - components/page.js</td>
  </tr>
  <tr>
    <td>https://shopify.dev/marketplaces/shops</td>
    <td>pages/shops/[id].js - pages/index.js - components/productGrid.js - pages/products/[shopid]/[producthandle].js</td>
  </tr>
  <tr>
    <td>https://shopify.dev/marketplaces/cart-and-checkout</td>
    <td>helpers/cartHelpers.js - components/page.js - pages/products/[shopid]/[productHandle].js - pages/cart.js
  </tr>
</table>


## 4. Key tech
- Main tech- frontend framework: [NextJS](https://nextjs.org/), which is a framework for [ReactJS](https://reactjs.org/) 
- Main CSS library: [`MUI - Material UI`](https://mui.com/)  
- Data fetching: [`GraphQL`](https://graphql.org/)
- The Shopify API that provides store channel data: [`Storefront API`](https://shopify.dev/api/storefront#top)

## 5. License

This repository is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
