#loopback-example-datagraph
The purpose of this example is to demonstrate model relations in [LoopBack](http://loopback.io).

##Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Example](#example)
  - [Getting Started](#1-getting-started)
  - [Create the Models](#2-create-the-models)
  - [Create the Front-end](#3-create-the-front-end)
  - [Add Sample Data](#4-add-sample-data)
  - [Create Model Relations](#5-create-model-relations)
  - [Try the API](#6-try-the-api)
  - [Conclusion](#7-conclusion)

##Overview
We will create a web application to demonstrate model relations. The main page will consist of various links that allow us to query and filter data through an exposed REST API.

##Prerequisites
This guide assumes you have working knowledge of:
- [LoopBack Database Connectors](https://github.com/strongloop/loopback-example-database)
- [LoopBack Models](http://docs.strongloop.com/display/LB/Working+with+models)

You should also have the following installed:
- [Node.js](http://nodejs.org/)
- [NPM](http://www.npmjs.com/)
- [StrongLoop Controller](http://strongloop.com/get-started/) `npm install -g strongloop`

##Example
###1. Getting Started
Let's begin by [scaffolding](http://docs.strongloop.com/pages/viewpage.action?pageId=3836281) the application:
```shell
slc loopback
```
You should see:
```shell
...
[?] Enter a directory name where to create the project: (.)
```
Enter `loopback-example-datagraph` as the project name (we'll refer to the generated directory as the *project root* from hereon). Finish the creation process by following the prompts.

###2. Create the Models
We will be using an in-memory database to hold our data. [Create a model](http://docs.strongloop.com/display/LB/Creating+models) named `Customer` by running:

```shell
cd loopback-example-datagraph
slc loopback:model Customer
```
You should see:
```shell
[?] Enter the model name: Customer
[?] Select the data-source to attach Customer to: db (memory)
[?] Expose Customer via the REST API? Yes
[?] Custom plural form (used to build REST URL):
Let's add some Customer properties now.

Enter an empty property name when done.
[?] Property name: name
   invoke   loopback:property
[?] Property type: string
[?] Required? No

Let's add another Customer property.
Enter an empty property name when done.
[?] Property name: age
   invoke   loopback:property
[?] Property type: number
[?] Required? No

Let's add another Customer property.
Enter an empty property name when done.
[?] Property name: #leave blank, press enter
```
Follow the prompts to finish creating the model. Repeat for `Review` and `Order` using the following properties:
- Review
  - product:string
  - star:number
- Order
  - description:string
  - total:number

> You should see `customer.json`, `order.json` and `review.json` in `common/models` when you're done.

###3. Create the Front-end
Let's create a front-end to make it easier to analyze our data. To install [EJS](http://embeddedjs.com/), run the following from the project root:
```shell
npm install --save ejs
```
Then configure the application [view engine](http://expressjs.com/api) by modifying `server/server.js` to look like:
```node
...
// -- Mount static files here--
...
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('json spaces', 2); //pretty print results for easier viewing later
...
```
Next, modify `server/boot/root.js` to look like:
```node
module.exports = function(server) {
  var router = server.loopback.Router();
  router.get('/', function(req, res) {
    res.render('index');
  });
  server.use(router);
};
```
Finally, create the `views` directory by running:
```shell
mkdir -p server/views
```
Inside the `views` directory, create `index.html` with the following contents:
```html
<DOCTYPE html>
<html>
  <head>
    <title>loopback-example-datagraph</title>
  </head>
  <body>
    <h1>loopback-example-datagraph</h1>
    <p>
      <a href="/explorer">API Explorer</a>
    </p>
    <h2>API</h2>
    <ul>
      <li><a href='/api/customers'>/api/customers</a>
      <li><a href='/api/customers?filter[fields][name]=true'>/api/customers?filter[fields][name]=true</a>
      <li><a href='/api/customers/1'>/api/customers/1</a>
      <li><a href='/api/customers/youngFolks'>/api/customers/youngFolks</a>
      <li><a href='/api/customers/1/reviews'>/api/customers/1/reviews</a>
      <li><a href='/api/customers/1/orders'>/api/customers/1/orders</a>
      <li><a href='/api/customers?filter[include]=reviews'>/api/customers?filter[include]=reviews</a>
      <li><a href='/api/customers?filter[include][reviews]=author'>/api/customers?filter[include][reviews]=author</a>
      <li><a href='/api/customers?filter[include][reviews]=author&filter[where][age]=21'>/api/customers?filter[include][reviews]=author&filter[where][age]=21</a>
      <li><a href='/api/customers?filter[include][reviews]=author&filter[limit]=2'>/api/customers?filter[include][reviews]=author&filter[limit]=2</a>
      <li><a href='/api/customers?filter[include]=reviews&filter[include]=orders'>/api/customers?filter[include]=reviews&filter[include]=orders</a>
    </ul>
  </body>
</html>
```
You can view what we have so far by executing `slc run server` from the project root and browsing to [localhost:3000](http://localhost:3000). Click on [API Explorer](http://localhost:3000/explorer) and you will notice that the models we created from [step 2](#2-create-the-models) are there.

> You may also notice some of the API endpoints return empty arrays or errors. It's because the database is empty. In addition, we need to define model relations for some of the API endpoints to work. Don't fret, we'll get to all that very soon!

###4. Add Sample Data
In `server/boot`, create a script named `create-customers.js` with the following contents:
```node
var customers = [
  {name: 'Customer A', age: 21},
  {name: 'Customer B', age: 22},
  {name: 'Customer C', age: 23},
  {name: 'Customer D', age: 24},
  {name: 'Customer E', age: 25}
];

module.exports = function(server) {
  var dataSource = server.dataSources.db;
  dataSource.automigrate('customer', function(er) {
    if (er) throw er;
    var Model = server.models.Customer;
    //create sample data
    var count = customers.length;
    customers.forEach(function(customer) {
      Model.create(customer, function(er, result) {
        if (er) return;
        console.log('Record created:', result);
        count--;
        if (count === 0) {
          console.log('done');
          dataSource.disconnect();
        }
      });
    });
    //define a custom scope
    Model.scope('youngFolks', {where: {age: {lte: 22 }}});
  });
};
```
Create two more scripts, [create-reviews.js](server/boot/create-reviews.js) and [create-orders.js](server/boot/create-orders.js) in `server/boot`. This sample data will be automatically loaded when you start the application.

> `automigrate()` recreates the database table/index if it already exists. In other words, existing tables will be dropped and ALL EXISTING DATA WILL BE LOST. For more information, see the [documentation](http://apidocs.strongloop.com/loopback-datasource-juggler/#datasourceautomigratemodel-callback).

> `Model.scope...` is only in `create-customers.js`.

###5. Create Model Relations
From the project root, run:
```shell
slc loopback:relation
```
Follow the prompts and create the following relationships:
- Customer
  - has many
    - Review
      - property name for the relation: reviews
      - custom foreign key: authorId
    - Order
      - property name for the relation: orders
      - custom foreign key: customerId

---
- Review
  - belongs to
    - Customer
      - property name for the relation: author
      - custom foreign key: authorId

---
- Order
  - belongs to
    - Customer

> For any item without *property name for the relation* or *custom foreign key*, just use the defaults. LoopBack will [derive](http://docs.strongloop.com/display/LB/BelongsTo+relations#BelongsTorelations-Overview) these values automatically when you don't specify one.

When you're done, your `common/models/customer.json` should look like:
```json
{
  "name": "Customer",
  "base": "PersistedModel",
  "properties": {
    "name": {
      "type": "string"
    },
    "age": {
      "type": "number"
    }
  },
  "validations": [],
  "relations": {
    "reviews": {
      "type": "hasMany",
      "model": "Review",
      "foreignKey": "authorId"
    },
    "orders": {
      "type": "hasMany",
      "model": "Order",
      "foreignKey": "customerId"
    }
  },
  "acls": [],
  "methods": []
}
```
`common/models/reviews.json` should look like:
```json
{
  "name": "Review",
  "base": "PersistedModel",
  "properties": {
    "product": {
      "type": "string"
    },
    "star": {
      "type": "number"
    }
  },
  "validations": [],
  "relations": {
    "author": {
      "type": "belongsTo",
      "model": "Customer",
      "foreignKey": "authorId"
    }
  },
  "acls": [],
  "methods": []
}
```
and `common/models/order.json` should look like:
```json
{
  "name": "Order",
  "base": "PersistedModel",
  "properties": {
    "description": {
      "type": "string"
    },
    "total": {
      "type": "number"
    }
  },
  "validations": [],
  "relations": {
    "customer": {
      "type": "belongsTo",
      "model": "Customer",
      "foreignKey": ""
    }
  },
  "acls": [],
  "methods": []
}
```
> You should be creating four relations in total: *Customer has many Reviews*, *Customer has many Orders*, *Review belongs to Customer* and *Order belongs to Customer*.

###6. Try the API
Restart application (`slc run server` in case you forgot) and browse to [localhost:3000](http://localhost:3000). Each endpoint should be working properly now that we've defined the model relations. See the following endpoint descriptions:

- [/api/customers](http://localhost:3000/api/customers)
  - List all customers

---
- [/api/customers?filter[fields][0]=name](http://localhost:3000/api/customers?filter[fields][0]=name)
  - List all customers, but only return the name property for each result

---
- [/api/customers/1](http://localhost:3000/api/customers/1)
  - Look up a customer by ID

---
- [/api/customers/youngFolks](http://localhost:3000/api/customers/youngFolks)
  - List a predefined scope named *youngFolks*

---
- [/api/customers/1/reviews](http://localhost:3000/api/customers/1/reviews)
  - List all reviews posted by a given customer

---
- [/api/customers/1/orders](http://localhost:3000/api/customers/1/orders)
  - List all orders placed by a given customer

---
- [/api/customers?filter[include]=reviews](http://localhost:3000/api/customers?filter[include]=reviews)
  - List all customers including their reviews

---
- [/api/customers?filter[include][reviews]=author](http://localhost:3000/api/customers?filter[include][reviews]=author)
  - List all customers including their reviews which also include the author

---
- [/api/customers?filter[include][reviews]=author&filter[where][age]=21](http://localhost:3000/api/customers?filter[include][reviews]=author&filter[where][age]=21)
  - List all customers whose age is 21, including their reviews which also include the author

---
- [/api/customers?filter[include][reviews]=author&filter[limit]=2](http://localhost:3000/api/customers?filter[include][reviews]=author&filter[limit]=2)
  - List first two customers including their reviews which also include the author

---
- [/api/customers?filter[include]=reviews&filter[include]=orders](http://localhost:3000/api/customers?filter[include]=reviews&filter[include]=orders)
  - List all customers including their reviews and orders

###7. Conclusion
That's it! You've successfully created an application with models formed into a complex data graph! For a deeper dive into relations, see this [blog entry](http://strongloop.com/strongblog/defining-and-mapping-data-relations-with-loopback-connected-models/) (the examples were written for LoopBack 1.x, but the concepts still apply). If you have further questions, please refer to the [LoopBack documentation](http://docs.strongloop.com/display/LB/LoopBack+2.0).
