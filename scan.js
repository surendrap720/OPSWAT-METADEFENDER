//importing all the libraries
const http = require('https');
const fs = require('fs');
const prompt = require('prompt-sync')();
const md5File = require('md5-file');
require('dotenv').config();

let filename, hash;

/*
loop to prompt the user to enter the name of the file to be scanned
Please enter the filepath
*/
while (true) {
    filename = prompt('Enter the name of the file to be scanned (press "q" to quit): ');
    if (filename === 'q') //to quit
        process.exit(1);

    try {
        hash = md5File.sync(filename) // Calculates hash
        break;
    }

    catch (e) {
        console.log('File not found! Please check the filepath and try again!');
    }
}

hashLookup(); // function call will start the process


/*
The hashLookup function uses the hash variable to check if there is a cached data for the file
by making a GET request to the API api.metadefender.com/v4/hash/:hash
If there is a cached data, it directly calls the showScanResult() function which displays the result.
Otherwise, it calls the uploadFileToScan() function to scan the file for the first time.
*/
function hashLookup() { // Retrieves scan results using a data hash
    console.log("Checking if hash exists in cache");

    const options = {
        "method": "GET",
        "hostname": "api.metadefender.com",
        "path": `/v4/hash/${hash}`,
        "headers": {
            "apikey": process.env.APIKEY // Note: Your APIKEY should be in .env file
        }
    };

    const req = http.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks);

            try {
                const scanned_obj = JSON.parse(body);
                if (scanned_obj.scan_results) { // Hash found: displays results
                    console.log("Hash found in cache!");
                    console.log('Retrieving scan results using a data hash...');
                    showScanResult(scanned_obj); // showScanResult function will display the scan result
                }

                else if (scanned_obj.error) { // Hash not found: upload the file
                    console.log("Hash not found! Uploading file for scanning...");
                    uploadFileToScan(filename); // uploadFileToScan function will upload the file and get the dataId
                }
            }

            catch(e) {
                console.log(e);
            }
        });
    });

    req.end();
}


/*
The uploadFileToScan function takes the file as input and uploads it by making a POST request to the
API api.metadefender.com/v4/filePath and Uses the dataId to call the retrieveResults() function
to get the scan results.
*/
function uploadFileToScan(filename) { // Scans a file by file upload (as multipart)
    const file = fs.readFileSync(filename);
    const boundary = '69b2c2b9c464731d'
    const content = "--" + boundary + "\r\n"
        + `Content-Disposition: form-data; name=\"file\"; filename=\"${filename}\"\r\n`
        + "Content-Type: application/octet-stream\r\n"
        + "Content-Transfer-Encoding: BINARY\r\n"
        + "\r\n"
        + file + "\r\n"
        + "--" + boundary + "--\r\n";

    const options = {
        "method": "POST",
        "hostname": "api.metadefender.com",
        "path": "/v4/file",
        "headers": {
            "Content-Type": 'multipart/form-data; boundary=' + boundary,
            "apikey": process.env.APIKEY,
        }
    };

    const req = http.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks);

            try { // Upload successful: retrieves ID and scan
                const dataId = JSON.parse(body).data_id;
                if (!dataId)
                    console.log('Upload failed!');
                else {
                    console.log('File Successfully uploaded! Retrieving scan results using data ID...');
                    retrieveResults(dataId); // retrieveResults function called to retrieve the result
                }
            }

            catch(e) {
                console.log(e);
            }
        });
    });

    req.write(content);
    req.end();
}


/*
The retrieveResults function takes the dataId as an input and
makes a GET request to the API api.metadefender.com/v4/file/:dataId
to retrieve the details of the scan. The function calls itself until
it retrieves 100% of the details. The progress is checked after every one second.
*/
function retrieveResults(dataId) { // Retrieves scan results using data ID
    const options = {
        "method": "GET",
        "hostname": "api.metadefender.com",
        "path": `/v4/file/${dataId}`,
        "headers": {
            "apikey": process.env.APIKEY
        }
    };

    const req = http.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks);

            try {
                const obj = JSON.parse(body);
                const prog = obj.scan_results.progress_percentage; // progress percentage
                if (prog < 100) { // keeps polling every second until scanning is done
                    setTimeout(() => {
                        console.log(`${prog}% done...`);
                        retrieveResults(dataId);
                    }, 1000);
                }
                else

                    showScanResult(obj); //showScanResult function called and obj object is passed.
            }

            catch (e) {
                console.log(e);
            }
        });
    });

    req.end();
}


/*
the showScanResult function takes the object as an input and display all the required data to the console.
*/
function showScanResult(obj) { // Displays results in the given format
  console.log("Showing details of scan for all engine");
    try {
        console.log(`filename: ${filename}`);
        const res = obj.scan_results;
        console.log(`overall_status: ${res.scan_all_result_a}`);
        console.log("-----------------------------");
        for (let engine in res.scan_details) {
            const engine_scan_details = res.scan_details[engine];
            console.log(`engine: ${engine}`);
            console.log(`threat_found: ${engine_scan_details.threat_found}`);
            console.log(`scan_result: ${engine_scan_details.scan_result_i}`);
            console.log(`def_time: ${engine_scan_details.def_time}`);
            console.log("-----------------------------");
        }

        console.log('END');
    }

    catch(e) {
        console.log('Parsing error!');
    }
}
