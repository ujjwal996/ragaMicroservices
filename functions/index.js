var functions = require('firebase-functions');
var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.addInvite = functions.https.onRequest((req,res)=>{
    /*
    TODO - 
    fasten the working of this function. the most called function. 
    Primary delay at the nested promise structure to retrive uid from mapping then pushing to invite Forms. last run -3seconds. 
    */
    const tform = req.body;
    const pid = tform.form_response.hidden.pid;
    console.log(req.body);

    const data = {
        'name' : filterData(tform.form_response.answers[0],tform.form_response.answers[0].type),
        'email' : filterData(tform.form_response.answers[1],tform.form_response.answers[1].type),
        'phoneNum' : filterData(tform.form_response.answers[2],tform.form_response.answers[2].type),
        'notes' : filterData(tform.form_response.answers[3],tform.form_response.answers[3].type)
    };
    console.log(data);

    
   // console.log("PID:"+pid+"UID:",uid);
    
    function filterData(parent, type){
        if(type==='text') return parent.text;
        else if(type === 'choice') return parent.choice;
    }

    admin.database().ref('mapping/'+ pid).once("value",function(snapshot){
        const uid = snapshot.val();
        console.log('uid retrived');

        admin.database().ref('inviteForms/'+ uid).push({'data' : data}).then((snapshot)=>{
            res.writeHead(200);
            res.end();
        },(err)=>{console.log(err);});

    },(err)=>{console.log(error,"error retrieving uid")});
    
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
    const pid = event.data.displayName;//change this
    admin.database().ref('mapping/'+ pid).set(uid).then((res)=>{
        console.log('success');
    },(err)=>{
        console.log('Error in creating mapping' , err);
    });
});

exports.shortenURL = functions.database.ref('profile/{uid}/links').onWrite((event)=>{
    const request = require('request-promise');
    const snapshot = event.data;
    const uid = event.params.uid;
    if(typeof snapshot.val()!=='string'){
        return;
    }
    console.log("profile/{clientid}/links" , snapshot);
    return createShortnerPromise(snapshot, uid);
});

function createShortnerRequest(longUrl){
    return {
    method: 'POST',
    uri: `https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDpiX3UuqsfVYtDEGxPQQgW78scdFJGSaw`,//${functions.config().firebase.apiKey}
    body: {
      longUrl: longUrl
    },
    json: true,
    resolveWithFullResponse: true
}

function createShortnerPromise(snapshot, uid){
    key = snapshot.key;
    longUrl = snapshot.val();
    return request(createShortnerRequest(longUrl)).then((res)=>{
        if(res.statusCode === 200){
            return res.body.id;
        }
        throw res.body
    }).then((shortUrl)=>{
        console.log(shortUrl);
        return admin.database().ref('profile/'+uid+'/links').update({shortUrl : shortUrl});
    });
}

}