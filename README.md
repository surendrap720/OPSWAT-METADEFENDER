# FILE SCAN - OPSWAT'S METADEFENDER API 
A simple NodeJs program to scan a file against OPSWAT's metadefender.opswat.com API.

## Setup
1. Install NodeJs Version 10
2. Clone the repo 
3. Install all the modules by running the command `npm install`
4. If `npm install` does not work you can do `npm install htts fs prompt-sync md5-file dotenv`
5. In .env file substitute your api key inside the quotes Example: `APIKEY = "2b220b56b502e0aa5bf6557642f38089"`

## Folder Structure
1. `.env` - file containing the APIKEY 
2. `.gitignore` - file containing list of files or folders that will not be tracked by git, in this project it has node_modules
3. `package-lock.json` - file containing list of all the modules and dependencies used in our project. 
4. `scan.js` - file which contains all the function to upload scan and get the results of the program. 

## Modules/Libraries used
1. `https` - The HTTPS module provides a way of making Node. js transfer data over HTTP TLS/SSL protocol, which is the secure HTTP protocol.
2. `fs` - The fs module is used to access physical file system. The fs module is responsible for all the asynchronous or synchronous file I/O operations.
3. `prompt-sync` - A synchronous prompt for node. The prompt-sync module is a function that creates prompting functions.
4. `md5-file` - The md5-file module is used to get the MD5-sum of a given file, with low memory usage, even on huge files.
5. `dotenv` - The dotenv is a zero-dependency module that loads environment variables from a . env file into process. env

## Run the program
Use the following command to run the program 

`node scan.js`

## Steps followed by the program 
The program scans the file using OPSWAT's Metadefender API and with the help of following steps:

1. Calculate the hash of the given samplefile.txt.
2. Perform a hash lookup against metadefender.opswat.com and see if there are previously cached results for the file.
3. If results found then skip to 6.
4. If results not found then upload the file, receive a data_id.
5. Repeatedly poll on the data_id to retrieve results
6. Display results.

## Program Details
Once you run the program there will be a prompt asking you to give a file path. Write the full path of the file. 
```
C:\Users\Suru\Desktop\OPSWAT-MetaDefender>node scan.js
Enter the name of the file to be scanned (press "q" to quit): C:/Users/Suru/Desktop/bloomberg.pdf
```

After entering the file path hit enter, md5 hash will be calculated and hashLookup function will be called. 
The hashLookup function uses the hash variable to check if there is a cached data for the file
by making a GET request to the API api.metadefender.com/v4/hash/:hash
If there is a cached data, it directly calls the showScanResult() function which displays the result.
Otherwise, it calls the uploadFileToScan() function to scan the file for the first time.
<br/>

Sample Output:
```
Checking if hash exists in cache
Hash not found! Uploading file for scanning...
File Successfully uploaded! Retrieving scan results using data ID...
0% done...
5% done...
5% done...
Showing details of scan for all engine
filename: input.txt
overall_status: No Threat Detected
-----------------------------
engine: AegisLab
threat_found:
scan_result: 0
def_time: 2021-05-06T05:00:46.000Z
-----------------------------
engine: Ahnlab
threat_found:
scan_result: 0
def_time: 2021-05-06T00:00:00.000Z
```

## Functions used in the program
1. `hashLookUp()` - The hashLookup function uses the `hash` variable to check if there is a cached data for the file
by making a `GET` request to the API `api.metadefender.com/v4/hash/:hash`
If there is a cached data, it directly calls the `showScanResult()` function which displays the result.
Otherwise, it calls the `uploadFileToScan()` function to scan the file for the first time.

2. `uploadFileToScan()` - The `uploadFileToScan()` function takes the file as input and uploads it by making a `POST` request to the
API `api.metadefender.com/v4/filePath` and Uses the `dataId` to call the `retrieveResults()` function
to get the scan results.

3. `retrieveResults()` - The `retrieveResults()` function takes the `dataId` as an input and
makes a `GET` request to the API `api.metadefender.com/v4/file/:dataId`
to retrieve the details of the scan. The function calls itself until
it retrieves 100% of the details. The progress is checked after every one second.

4. `showScanResult()` -  the `showScanResult()` function takes the object as an input and display all the required data to the console.

## HTTPS Requests

1. `POST` - `https://api.metadefender.com/v4/file`
2. `GET`  - `https://api.metadefender.com/v4/file/:dataId`
3. `GET`  - `https://api.metadefender.com/v4/hash/:hash`
