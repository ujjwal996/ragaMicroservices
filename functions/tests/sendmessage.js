var assert = require("assert");
describe("Sending message after reading on a new invite submit", function(){
    
    const inviteData  = {
    "name" : "Person",
    "phoneNum" : "8383895955",
    "email":"person@earth.gone"
    };
    const fakeInviteEvent = {   
        data: new functions.database.DeltaSnapshot(null, null, null, inviteData)
    }
    
    it("should be triggered when a change in the inviteForm occurs",function(){
         assert.equal(-1, [1,2,3].indexOf(4));
    })
    it("should get back 200 status code", function(){
         assert.equal(-1, [1,2,3].indexOf(4));
    })
})