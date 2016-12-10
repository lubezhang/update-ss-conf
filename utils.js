var exec = require('child_process').exec; 

module.exports.runShell = function (strCmd) {
    return new Promise((resolve, reject) => {
        // console.log(`Shell: ${strCmd}`);
        exec(strCmd, function(err, stdout, stderr){
            if(err) {
                reject(`执行shell失败 [${strCmd}]` + stderr);
            } else {
                resolve("执行shell成功 ", stdout);
            }
        });
    })
}