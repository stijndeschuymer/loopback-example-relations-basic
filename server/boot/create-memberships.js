var memberships = [
  {userid:'E863EA61-C07D-47EE-95E6-00009BD074ED', ismember: true, type: 'renter'},
  {userid:'A25B7B45-5F44-4114-AEA9-0001E7C0F132', ismember: true, type: 'owner'},
  {userid:'A5026114-F799-4AAD-8CA6-0003BE9A41E4', ismember: false, type: 'renter'}
];

module.exports = function(server) {
  var dataSource = server.dataSources.msdb;
  dataSource.automigrate('Membership', function(er) {
    if (er) throw er;
    var Model = server.models.Membership;
    //create sample data
    var count = memberships.length;
    memberships.forEach(function(membership) {
      Model.create(membership, function(er, result) {
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
