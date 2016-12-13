var fs = require('fs');
var lineReader = require('line-reader');
var cheerio = require('cheerio');

var utils = require("./utils")


const workshop = "workshop";
const xmlConfFile = "conf.xml";
const xmlNewConfFile = "newConf.xml";
const newPlist = "clowwindy.ShadowsocksX.new.plist"

function confToJson() {
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
                // console.log(line, " server conf exception");
                reject(line + " server conf exception")
            }

            if (last) {
                // console.log(JSON.stringify(serverList));
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

    return utils.runShell(`cp ~/Library/Preferences/clowwindy.ShadowsocksX.plist ./${workshop}/`)
}

function plist2xml() {
    console.log("plist2xml");
    // `plutil -convert xml1 clowwindy.ShadowsocksX.plist -o ss.xml`
    return utils.runShell(`plutil -convert xml1 ./${workshop}/clowwindy.ShadowsocksX.plist -o ./${workshop}/${xmlConfFile}`)
}

/**
 * 将代理服务器的配置信息写入到plist的xml文件中
 */
function updateServerConf(serverConf) {
    console.log("updateServerConf");
    return new Promise((resolve, reject) => {
        fs.readFile(`./${workshop}/${xmlConfFile}`, function(err, data) {
            if(err) {
                reject(err);
            }
            var $ = cheerio.load(data.toString(), {
                xmlMode: true
            })
            var $data = $("dict").find("data");
            // console.log($data.html());
            var conf = new Buffer($data.text(), "base64").toString();
            console.log(conf);
            var confJson = JSON.parse(conf);

            var serverList = {
                "current": 0,
                "profiles": serverConf
            }
            let b64 = new Buffer(JSON.stringify(serverList)).toString('base64');
            $data.text(`${b64}\n`)
            resolve($.html())
            // confToJson().then(server => {
            //     // console.log(confJson);
            //     confJson.profiles = server;
            //     let b64 = new Buffer(JSON.stringify(confJson)).toString('base64');
            //     $data.text(`${b64}\n`)
            //     resolve($.html());
            // }).catch(error =>{
            //     reject(error)
            // })
        })
    });
}


function writeConfXML(content) {
    console.log("writeConfXML");
    // console.log(content);
    return new Promise((resolve, reject) => {
        fs.writeFile(`./${workshop}/${xmlNewConfFile}`, content, function(err) {
            if(err) {
                reject(err);
            }
            resolve()
        }); 
    })
}

function xml2plist() {
    console.log("xml2plist");

    return utils.runShell(`plutil -convert binary1 ./${workshop}/${xmlNewConfFile} -o ./${workshop}/${newPlist}`);
}

function importServerConf() {
    console.log("importServerConf");
    return utils.runShell(`defaults import clowwindy.ShadowsocksX ./${workshop}/${newPlist}`);
}

function autoUpdate() {
    backupPlist().then(res => {
        return plist2xml();
    }).then(res => {
        return confToJson();
    }).then(res => {
        return updateServerConf(res);
    }).then(res => {
        return writeConfXML(res)
    }).then(res => {
        return xml2plist();
    }).then(res => {
        return importServerConf()
    }).catch(err => {
        console.log("自动更新代理服务器配置失败：", err);
    });
    // console.log("done");
}

autoUpdate();