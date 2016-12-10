var fs = require('fs');
var exec = require('child_process').exec; 
var lineReader = require('line-reader');
var xmlreader = require("xmlreader");
var xml2js = require('xml2js');
var builder = require('xmlbuilder');

var utils = require("./utils")

var parser = new xml2js.Parser()

const workshop = "workshop";
const xmlFile = "conf.xml";

function confToJson(confFilw) {
    console.log("将配置信息转json");
    return new Promise((resolve, reject) => {
        var serverList = [], tmp = {};
        lineReader.eachLine('ss-conf', function (line, last) {
            var serverConf = line.split(" ");
            if (serverConf && serverConf.length === 5) {
                tmp = {
                    "password": serverConf[3],
                    "method": serverConf[2],
                    "server_port": serverConf[1],
                    "remarks": serverConf[4],
                    "server": serverConf[0]
                }
                serverList.push(tmp)
            } else {
                console.log(line, " server conf exception");
                reject(line + " server conf exception")
            }

            if (last) {
                resolve(serverList)
                return false;
            }
        });
    })
}

function backupPlist() {
    console.log("备份ShadowsocksX 客户端的代理服务器配置文件");
    var cpConfShell = "cp ~/Library/Preferences/clowwindy.ShadowsocksX.plist ~/backups"

    if (fs.existsSync(workshop)) {
        // console.log('已经创建过此更新目录了');
    } else {
        fs.mkdirSync(workshop);
        // console.log('更新目录已创建成功\n');
    }

    utils.runShell(`cp ~/Library/Preferences/clowwindy.ShadowsocksX.plist ./${workshop}/`).then(() =>{
        
    })
}

function autoUpdate() {
    // confToJson().then((list) => {
    //     // console.log(list);
    // }); 

    backupPlist();
    fullConf();
}

function fullConf() {
    // `plutil -convert xml1 clowwindy.ShadowsocksX.plist -o ss.xml`
    utils.runShell(`plutil -convert xml1 ./${workshop}/clowwindy.ShadowsocksX.plist -o ./${workshop}/${xmlFile}`)
        .then(res => {
            readXML()
        }).catch(error => {
            console.log("填充配置文件失败：", error);
        })
}

function readXML() {
    // lineReader.eachLine(`./${workshop}/${xmlFile}`, function(line, last) {
    //     console.log(line);
    // })

    fs.readFile(`./${workshop}/${xmlFile}`, function(err, data) {
        parser.parseString(data, function (err, result) {
            var confData = result.plist.dict[0].data[0];
            console.log(confData);
            console.log(new Buffer(confData, 'base64').toString());
            console.log('Done');
            // var a = new Buffer('key1=value1&key2=value2').toString('base64');
        });
    });
}

/**
 * 将代理服务器的配置信息写入到plist的xml文件中
 */
function writeServerConf() {

}

autoUpdate();