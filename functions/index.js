var functions = require('firebase-functions');
var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.addInvite = functions.https.onRequest((req,res)=>{
    /*
    TODO - 
    fasten the working of this function. The most frequently called function. 
    Primary delay at the nested promise structure to retrive uid from mapping then pushing to invite Forms. last run -3seconds. 
    */
    if(req.method !== "POST"){
        return
    }
    const tform = req.body;
    const pid = tform.form_response.hidden.pid;
    
    //console.log(req.body);

    function filterData(parent, type){
        /**
         Extracts answers from typeform response
         */
        return parent[type];
    }

    const data = {
        'name' : filterData(tform.form_response.answers[0],tform.form_response.answers[0].type),
        'email' : filterData(tform.form_response.answers[1],tform.form_response.answers[1].type),
        'phoneNum' : filterData(tform.form_response.answers[2],tform.form_response.answers[2].type),
        'notes' : filterData(tform.form_response.answers[3],tform.form_response.answers[3].type),
        'typeformUid' : tform.form_response.form_id, // to use DATA Api in the future
        'hiddenFields' : tform.form_response.hidden // hidden object of a single level
    };
    console.log(data);

    
   // console.log("PID:"+pid+"UID:",uid);
   //mapping database -> mapping/{"<pid>" : "<uid>"} 

    admin.database().ref('mapping/'+ pid).once("value",function(snapshot){
        
        if(snapshot.val()===null){
            /** 
             * No mapping set for this pid.
             *  Store complete form at /unmarked with an error object added.
            */
            tform['error'] = "UID not found for pid";
            admin.database.ref('unmarked/').push(tform).then((res)=>{
                return ;
                //throw error ; Skip the rest of the function
            },(err)=>{});
        }

        const uid = snapshot.val();
        console.log('uid retrived', uid);

        admin.database().ref('inviteForms/'+ uid).push( data ).then((snapshot)=>{
            res.writeHead(200);
            res.end();
            //console.log(snapshot);
        },(err)=>{console.log(err);});

    },(err)=>{console.log(error,"error referencing mapping/pid")});
    
    admin.database().ref('timeSeries').push(tform.form_response);
});

/*

exports.sendMessage = functions.database.ref('inviteForms/{uid}').onWrite((event)=>{

    const textconfig = require('./config/textconfig');
    const phoneNum = event.data.phoneNum;
    
    
    textconfig.dmobile = '91'+ phoneNum.slice(-10);
    textconfig.message = encodeURIComponent(admin.database().ref('profile/'+uid).child('inviteMessage').val() + "/n" + admin.database.ref('profile/'+uid+'/links').child('shortUrl').val());
    console.log(textconfig.message);

    var http = require('http');

    const path = '/imobile/api.php?username='+textconfig.username+'&password='+textconfig.password+'&source='+textconfig.source+'&dmobile='+textconfig.dmobile+'&message='+textconfig.message;
    
    console.log(path);
    console.log("required path - http://txtguru.in/imobile/api.php?username=auomcoin&password=10862532&source=UPDATE&dmobile=918284047608,918284047606&message=TEST+SMS+GATEWAY");
    
    var options = {
    host: 'www.txtguru.in',
    path: path , 
    method : 'GET'
    };

    callback = function(response) {
    var str = '';
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        console.log("Get request : " , str);
    });
    }

    http.request(options, callback).end();

});
*/

exports.uidmapping = functions.auth.user().onCreate((event)=>{
    const uid = event.data.uid;
    const pid = event.data.displayName;// *** change this to a field never undefined ***
    admin.database().ref('mapping/'+ pid).set(uid).then((res)=>{
        console.log('success');
    },(err)=>{
        console.log('Error in creating mapping' , err);
    });
});

exports.shortenURL = functions.database.ref('profile/{uid}/links/longUrl').onWrite((event)=>{
    
    const GAPIkey = require('./config/goggleconfig').APIkey;

    const requestPromise = require('request-promise');
    const snapshot = event.data;
    const uid = event.params.uid;
    if(typeof snapshot.val() !== 'string'){
        return;
    }

    console.log(" Long Url to be converted " , snapshot.val());
    return createShortnerPromise(snapshot, uid);
});

function createShortnerRequest(longUrl){
    return {
    method: 'POST',
    uri: `https://www.googleapis.com/urlshortener/v1/url?key=`+GAPIkey,//${functions.config().firebase.apiKey}
    body: {
      longUrl: longUrl
    },
    json: true,
    resolveWithFullResponse: true
}

function createShortnerPromise(snapshot, uid){
    key = snapshot.key;
    longUrl = snapshot.val();

    return requestPromise(createShortnerRequest(longUrl)).then((res)=>{
        if(res.statusCode === 200){
            return res.body.id;
        }
        throw res.body
    }).then((shortUrl)=>{
        console.log(shortUrl);
        return admin.database().ref('profile/'+uid+'/links').child('shortUrl').set(shortUrl);
    });
}

}