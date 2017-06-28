var assert = require("assert");
var sinon = require('sinon');

before(function(){
    //initialize app dummy
    admin = require("firebase-admin");
    initStub = sinon.stub(admin , "initializeApp");
    //fbase config dummy
    functions = require('firebase-functions');
    configStub = sinon.stub(functions , "config").returns({
        firebase : {
            databaseURL:"https://bakchodi.firebaseio.com",
            storageBucket:"bakchodi.appspot.com"
        }
    });
});

var functions = require("firebase-functions");


describe("A post request triggers writing the data to firebase database . ", function(){
    
    const typeform = require("./typeformMockdata");
    const firebase = require("firebase");

    it("checks if data is restored from POST", function(){
    
        const request = { body : typeform };
        const response = {
        writeHead: function(code){
            assert.equal(code, 200);
            //assert.equal(url, 'new_ref');
            done();
            }
        };
        
        //faking ref.once
        var EventEmitter = require('events').EventEmitter;
        path1="mapping/"+typeform.form_response.hidden.pid;
        resdata = new functions.database.DeltaSnapshot(null,null,null,null);//need a Data Snapshot
        
        const refStub = sinon.stub();
        const onceStub = sinon.stub();
        dbStub = sinon.stub(admin , "database");
        dbStub.returns({ref:refStub});
        refStub.withArgs(path1).returns({once : onceStub});
        var emitter = new EventEmitter;
        emitter.on('value',onceStub);
        onceStub.returns(resdata);
        emitter.emit('value');

        //Faking Push for invite forms
        path2 = "inviteForms/"+typeform.form_response.hidden.pid;
        formdata = typeform;
        const refStub1 = sinon.stub();
        const pushStub = sinon.stub();
        refStub1.withArgs(path2).returns({push : pushStub});
        pushStub.withArgs(formdata).returns(Promise.resolve({ref:'new_ref'}));

        var clfunctions = require("../index.js");
        clfunctions.addInvite(request,response);

    });

   
});

after(function(){
    initStub.restore();
    configStub.restore();
});