var members = [
  {userid:'E863EA61-C07D-47EE-95E6-00009BD074ED', name: 'Customer A', age: 21},
  {userid:'A25B7B45-5F44-4114-AEA9-0001E7C0F132', name: 'Customer B', age: 22},
  {userid:'A5026114-F799-4AAD-8CA6-0003BE9A41E4', name: 'Customer C', age: 23}
];

module.exports = function(server) {
  var dataSource = server.dataSources.msdb;
  var Model = server.models.Member;
  dataSource.automigrate('Member', function(er) {
    if (er) throw er;
    //create sample data
    var count = members.length;
    members.forEach(function(member) {
      Model.create(member, function(er, result) {
        if (er) return;
        console.log('Record created:', result);
        count--;
        if (count === 0) {
          console.log('done');
        }
      });
    });
  });
};
