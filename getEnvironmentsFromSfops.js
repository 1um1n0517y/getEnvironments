#!/usr/bin/env node

// USAGE:
// USE 'npm publish' TO PUBLISH MODULE TO THE NEXUS (YOU NEED TO BE LOGGED IN TO THE NEXUS WITH npm)
// USE 'npm install -g "@com.igt.gi/getEnvs"' ON THE MACHINE WHERE IT WILL BE EXECUTED
// USE 'getEnvs <your linux username> <your linux password>' COMMAND TO RUN SCRIPT. IT CAN BE RUN ANYWHERE ON THE MACHINE AFTER MODULE WAS INSTALLED WITH -g FLAG

const scp = require('node-scp');
const fs = require('fs');
const args = process.argv;

const username = args[2];
const password = args[3];


//--------------------------------------------
//DECLARATION
//--------------------------------------------

const fileNames = ['dc.conf', 'dev.conf'];

const excludedEnvs = ['acprod', 'bjprod', 'bjprodb', 'bjprodpg', 'devops01', 'giprod', 'kaprod', 'load01', 'load03', 'load04', 'miprod', 'mtprod', 'nzprod', 'paprod', 'prod', 'rgsapl', 'sandbox', 'tbdev01', 'tbint01', 'gs_ops_ac01_pm', 'rgs_ops_ka01_pm', 'txprod', 'tbint', 'gstmp01', 'rgs_ops_ac01_pm', 'ky01'];

//REMEMEBER WHEN EDITING TO PUT / AT THE END OF THE PATH
const sourceDestination = '/wworks/rgsmvn/deployer/etc/';

//SCP FILES TO ./ FOLDER
async function scpToDisk (fileName) {
    try {
      const client = await scp({
        host: 'sf-ops01.corp.wagerworks.com',
        port: 22,
        username: username,
        password: password,
        // privateKey: fs.readFileSync('./key.pem'),
        // passphrase: 'your key passphrase',
      })

      //DOWNLOAD
      await client.downloadFile(sourceDestination + fileName, `./${fileName}`);
      client.close() 
    } catch(e) {
      console.log(e)
      console.log(`\nError downloading file ${fileName}\nCheck if file name is correct and if it exists at sf-ops01.corp.wagerworks.com:${sourceDestination}. \nCheck if there is a network issue.\n`);
      process.exit();
    }
  }

const allEnvs = [];
let checkboxes = [];
//READ AND PARSE FILES 
function parseFiles () {
    

    //PARSE FILES
    for (let i = 0; i < fileNames.length; i++) {
        
        let options = [];

        let envs = fs.readFileSync(`./${fileNames[i]}`, options);
        envs = envs.toString();
        envs = envs.split('\n');

        for (let i = 0; i < envs.length; i++) {
            if (envs[i].substring(0, 8) == 'env_list') {
                envs = envs[i];
            }
        }

        //FIND LINE WITH ENVS
        envs = envs.substring(envs.indexOf('"') + 1, envs.length - 1);

        //CREATE ARRAY
        envs = envs.split(',');

        //SORT ARRAY BY NAME
        envs = envs.sort();

        //REMOVE excludedEnvs ELEMENTS FROM envs
        envs = envs.filter( ( el ) => !excludedEnvs.includes( el ) );

        //console.log(envs);

        //PUSH ARRAY INTO allEnvs - HOLDS ENVIRONMENT NAMES
        allEnvs.push(envs);

    }

    //REMOVE FROM allEnvs[0] ITEMS THAT ARE ALREADY CONATINED IN allEnvs[1]
    allEnvs[0] = allEnvs[0].filter( ( el ) => !allEnvs[1].includes( el ) );

    console.log(allEnvs)


    //CREATE CHECKBOX INPUT ELEMENTS FROM allEnvs ARRAY
    for (let i = 0; i < allEnvs.length; i++) {
      checkboxes[i] = [];
      //checkboxes[i].push('document.querySelector("#displayEnvsDiv").innerHTML = `');
      for (let j = 0; j < allEnvs[i].length; j++) {
        checkboxes[i].push('document.write(`<div class="inputFieldDivs"><input type="checkbox" name="envs" class="inptCheckbox" value="' + allEnvs[i][j] + '" id="' + allEnvs[i][j] + '"/><label for="' + allEnvs[i][j] + '">' + allEnvs[i][j] + '</label></div>`);');
        //checkboxes[i].push(`<div class="inputFieldDivs"><input type="checkbox" name="envs" class="inptCheckbox" value="${allEnvs[i][j]}" id="${allEnvs[i][j]}"/><label for="${allEnvs[i][j]}">${allEnvs[i][j]}</label></div>`);
        // checkboxes[i].push('document.querySelector("#displayEnvsDiv").append(`<div class="inputFieldDivs">`);');
        // checkboxes[i].push(`document.querySelector("#displayEnvsDiv").append('<input type="checkbox" name="envs" class="inptCheckbox" value="${allEnvs[i][j]}" id="${allEnvs[i][j]}">');`);
        // checkboxes[i].push(`document.querySelector("#displayEnvsDiv").append('<label for="${allEnvs[i][j]}">${allEnvs[i][j]}</label>');`);
        // checkboxes[i].push(`document.querySelector("#displayEnvsDiv").append('</div>');`);
      }
      //checkboxes[i].push('`;');
      checkboxes[i] = checkboxes[i].toString();
      checkboxes[i] = checkboxes[i].replace(/,/g, '\n');
    }

}


//--------------------------------------------
//EXECUTION
//--------------------------------------------


//ASYNC LOOP AND SCP EXECUTION
const execute = async (parseFiles) => {
    console.log(`\nDownloading files from sf-ops01.corp.wagerworks.com:${sourceDestination}.....\n`)

    for (let i = 0; i < fileNames.length; i++) {
        const scp = await scpToDisk(fileNames[i]);      
        console.log(`${fileNames[i]} copied to local storage.`);
        scp;

    }
  
    console.log('\nFinished downloading files.\n');

    //EXECUTE PARSING AFTER FILES ARE DOWNLOADED
    parseFiles();

    //WRITE FILES WITH CHECKBOX INPUT ELEMENTS
    try {
      for (let i = 0;i < checkboxes.length;i++) {
        fs.writeFileSync(`envs${i}.js`, checkboxes[i].toString())
      }

      console.log('\nCreated js files.\n\nAll done.\n')
    }
    catch (e) {
      console.log(e)
    }
  

}

execute(parseFiles);




