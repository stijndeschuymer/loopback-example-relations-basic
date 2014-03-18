var loopback = require('loopback');
var app = require('./../app');
var debug = require('debug')('datagraph');

var Customer, Order, Review;

setup(function () {

  Review.find({include: 'owner'}, function (err, reviews) {
    debug('reviews.author', reviews);
  });

  Customer.find({include: 'orders'}, function (err, customers) {
    debug('customers.orders', customers);
  });

  Review.find({include: {author: 'orders'}}, function (err, reviews) {
    debug('reviews.author.orders', reviews);
  });

  Review.find({
    include: {author: {orders: 'owner'}}
  }, function (err, reviews) {
    debug('reviews.author.orders.owner', reviews);
  });

  Customer.find({include: ['orders', 'reviews']}, function (err, customers) {
    debug('customers.reviews && customers.orders', customers);
  });

});

function setup(done) {
  var db = loopback.createDataSource({connector: 'memory'});
  Customer = db.createModel('customer', {
    name: String,
    age: Number
  });
  Review = db.createModel('review', {
    product: String,
    star: Number
  });
  Order = db.createModel('order', {
    description: String,
    total: Number
  });

  Customer.scope("youngFolks", {where: {age: {lte: 22}}});
  Review.belongsTo(Customer, {foreignKey: 'authorId', as: 'author'});
  Customer.hasMany(Review, {foreignKey: 'authorId', as: 'reviews'});
  Customer.hasMany(Order, {foreignKey: 'customerId', as: 'orders'});
  Order.belongsTo(Customer, {foreignKey: 'customerId'});

  app.model(Customer);
  app.model(Order);
  app.model(Review);

  db.automigrate(function () {
    var createdCustomers = [];
    var createdReviews = [];
    var createdOrders = [];
    createCustomers();
    function createCustomers() {
      clearAndCreate(
        Customer,
        [
          {name: 'Customer A', age: 21},
          {name: 'Customer B', age: 22},
          {name: 'Customer C', age: 23},
          {name: 'Customer D', age: 24},
          {name: 'Customer E', age: 25}
        ],
        function (items) {
          createdCustomers = items;
          createReviews();
        }
      );
    }

    function createReviews() {
      clearAndCreate(
        Review,
        [
          {product: 'Product1', star: 3, authorId: createdCustomers[0].id},
          {product: 'Product2', star: 2, authorId: createdCustomers[1].id},
          {product: 'Product2', star: 5}
        ],
        function (items) {
          createdReviews = items;
          createOrders();
        }
      );
    }

    function createOrders() {
      clearAndCreate(
        Order,
        [
          {description: 'Order A', total: 200.45, customerId: createdCustomers[0].id},
          {description: 'Order B', total: 100, customerId: createdCustomers[0].id},
          {description: 'Order C', total: 350.45, customerId: createdCustomers[0].id},
          {description: 'Order D', total: 150.45, customerId: createdCustomers[1].id},
          {description: 'Order E', total: 10}
        ],
        function (items) {
          createdOrders = items;
          done();
        }
      );
    }

  });
}

function clearAndCreate(model, data, callback) {
  var createdItems = [];
  model.destroyAll(function () {
    nextItem(null, null);
  });

  var itemIndex = 0;

  function nextItem(err, lastItem) {
    if (lastItem !== null) {
      createdItems.push(lastItem);
    }
    if (itemIndex >= data.length) {
      callback(createdItems);
      return;
    }
    model.create(data[itemIndex], nextItem);
    itemIndex++;
  }
}

