var loopback = require('loopback');
var app = require('./../app');
var debug = require('debug')('datagraph');

var Member, Post, Passport;

setup(function () {

  Passport.find({include: 'owner'}, function (err, passports) {
    debug('passports.owner', passports);
  });

  Member.find({include: 'posts'}, function (err, members) {
    debug('members.posts', members);
  });

  Passport.find({include: {owner: 'posts'}}, function (err, passports) {
    debug('passports.owner.posts', passports);
  });

  Passport.find({
    include: {owner: {posts: 'author'}}
  }, function (err, passports) {
    debug('passports.owner.posts.author', passports);
  });

  Member.find({include: ['posts', 'passports']}, function (err, members) {
    debug('members.passports && members.posts', members);
  });

});

function setup(done) {
  var db = loopback.createDataSource({connector: 'memory'});
  Member = db.createModel('Member', {
    name: String,
    age: Number
  });
  Passport = db.createModel('Passport', {
    number: String
  });
  Post = db.createModel('Post', {
    title: String
  });

  Passport.belongsTo('owner', {model: Member});
  Member.hasMany('passports', {foreignKey: 'ownerId'});
  Member.hasMany('posts', {foreignKey: 'memberId'});
  Post.belongsTo('author', {model: Member, foreignKey: 'memberId'});

  app.model(Member);
  app.model(Post);
  app.model(Passport);

  db.automigrate(function () {
    var createdUsers = [];
    var createdPassports = [];
    var createdPosts = [];
    createUsers();
    function createUsers() {
      clearAndCreate(
        Member,
        [
          {name: 'Member A', age: 21},
          {name: 'Member B', age: 22},
          {name: 'Member C', age: 23},
          {name: 'Member D', age: 24},
          {name: 'Member E', age: 25}
        ],
        function (items) {
          createdUsers = items;
          createPassports();
        }
      );
    }

    function createPassports() {
      clearAndCreate(
        Passport,
        [
          {number: '1', ownerId: createdUsers[0].id},
          {number: '2', ownerId: createdUsers[1].id},
          {number: '3'}
        ],
        function (items) {
          createdPassports = items;
          createPosts();
        }
      );
    }

    function createPosts() {
      clearAndCreate(
        Post,
        [
          {title: 'Post A', memberId: createdUsers[0].id},
          {title: 'Post B', memberId: createdUsers[0].id},
          {title: 'Post C', memberId: createdUsers[0].id},
          {title: 'Post D', memberId: createdUsers[1].id},
          {title: 'Post E'}
        ],
        function (items) {
          createdPosts = items;
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

