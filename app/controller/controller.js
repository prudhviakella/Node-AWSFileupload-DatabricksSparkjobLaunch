const util = require("util");
const https = require("http");
const axios = require("axios");
const fs = require("fs");
const AWS = require("aws-sdk");
//var csv = require("fast-csv");
const csv = require("csv-parser");
var Audience = require("../model/audiencesegment");
const IncomingForm = require("formidable").IncomingForm;
const s3 = new AWS.S3({
  //accessKeyId: "AKIAIBJX6OBNMT5GGZEQ",
  //secretAccessKey: "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"
  accessKeyId: "AKIAI6DBAOWKRK4WOV6Q",
  secretAccessKey: "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"
});
const readFile = util.promisify(fs.readFile);

exports.upload = function(req, res) {
  var form = new IncomingForm();
  form.uploadDir = "C:/MySpace/Sito/SITONode/uploadedfiles";
  files = [];
  form.on("file", (field, file) => {
    // Do something with the file
    // e.g. save it to the database
    // you can access it using file.path
    files.push([field, file]);
  });
  form.on("end", function() {
    //console.log("-> upload done", files);

    res.json(files);
  });
  form.parse(req);
};

async function csvfilecheck(filepath, res) {
  //var csvStream = fs.createReadStream(filepath);
  fs.createReadStream(filepath)
    .pipe(csv())
    .on("data", row => {
      console.log(row);
    })
    .on("end", () => {
      console.log("CSV file successfully processed");
    });
  /*await csv
    .fromStream(csvStream, { headers: true })
    .validate(function(data) {
      console.log("inside validate", data);
    })
    .on("data-invalid", function(data) {
      console.log(data);
      //return employees whose salary less than 10000 and age less than 40
    })
    .on("data", function(data) {
      console.log("inside data", data);
    })
    .on("end", function() {
      console.log("done");
    });*/
}

exports.deletefile = function(req, res) {
  //console.log("delete file", req.body);
  try {
    fs.unlinkSync(req.body.path);
    res.status(200).json({ status: "deleted" });
    console.log("file deleted");
  } catch (err) {
    res.status(400).json({ status: "notdeleted", error: err });
  }
};

const getdatafromfile = async function getdatafromfile(key, filename) {
  var data1;
  await readFile(filename).then(data => {
    data1 = data;
  });
  const params = {
    Bucket: "sito-data-analysts",
    Key: key,
    Body: data1
  };
  return await s3.putObject(params).promise();
};

exports.maincall = async function(req, res) {
  // console.log("maincall request", req.body);
  var filesarr = [];
  var filename = "";
  var outputfile = "";
  var key = "";
  var inputpath = "";
  var outputpath = "";
  var bucketname = "sito-data-analysts";
  filesarr = req.body.files;
  inputpath = key =
    "/mnt/Salesforce_Tasks/" +
    req.body.SFID +
    "/" +
    req.body.CID +
    "/" +
    req.body.Name +
    "/" +
    "in/";
  outputpath = key =
    "/mnt/Salesforce_Tasks/" +
    req.body.SFID +
    "/" +
    req.body.CID +
    "/" +
    req.body.Name +
    "/" +
    "out/";
  for (i = 0; i < filesarr.length; i++) {
    key =
      "Salesforce_Tasks/" +
      req.body.SFID +
      "/" +
      req.body.CID +
      "/" +
      req.body.Name +
      "/" +
      "in/" +
      filesarr[i].name;

    filename = filesarr[i].path;
    await csvfilecheck(filename, res);
    await getdatafromfile(key, filename).then(data => {
      console.log("return value ", data);
      /*await uploaddataintos3(key, data).then(data => {
        outputfile = data.Location;
      });*/
    });
  }
  axios({
    method: "post",
    url:
      "https://dbc-4b7aace0-8d1f.cloud.databricks.com/api/2.0/clusters/start",
    headers: { "Content-Type": "application/json", Charset: "UTF-8" },
    data: {
      cluster_id: "0604-211958-newsy28"
    },
    auth: {
      username: "aprudhvi@sitomobile.com",
      password: "Prudhvi@9492"
    }
  })
    .then(function(response) {
      callnotebook(
        {
          sfid: req.body.SFID,
          name: req.body.Name,
          cid: req.body.CID,
          startdate: req.body.startdate,
          enddate: req.body.enddate,
          totalvisits: req.body.totalvisits,
          operator: req.body.operator,
          s3inputfile: "/" + bucketname + "/" + key,
          inputpath: inputpath,
          outputpath: outputpath
        },
        res
      );
    })
    .catch(error => {
      console.log("response from axios", error.response.data);
      callnotebook(
        {
          sfid: req.body.SFID,
          name: req.body.Name,
          cid: req.body.CID,
          startdate: req.body.startdate,
          enddate: req.body.enddate,
          totalvisits: req.body.totalvisits,
          operator: req.body.operator,
          s3inputfile: "/" + bucketname + "/" + key,
          inputpath: inputpath,
          outputpath: outputpath
        },
        res
      );
    });
};

function callnotebook(inputpayload, res) {
  console.log("callnotebook inputpayload", inputpayload);
  url = "https://dbc-4b7aace0-8d1f.cloud.databricks.com/api/2.0/jobs/run-now";
  job_id = "3853";
  notebook_params = {
    sfid: inputpayload.sfid,
    cid: inputpayload.cid,
    name: inputpayload.name,
    startdate: inputpayload.startdate,
    enddate: inputpayload.enddate,
    totalvisits: inputpayload.totalvisits,
    operator: inputpayload.operator,
    s3inputfile: inputpayload.s3inputfile,
    inputpath: inputpayload.inputpath,
    outputpath: inputpayload.outputpath
  };
  console.log(notebook_params);
  data = {
    job_id: job_id,
    notebook_params: notebook_params
  };
  axios({
    method: "post",
    url: url,
    headers: { "Content-Type": "application/json", Charset: "UTF-8" },
    data: data,
    auth: {
      username: "aprudhvi@sitomobile.com",
      password: "Prudhvi@9492"
    }
  })
    .then(function(response) {
      console.log(response.data);
      var insertdata = {
        sfid: inputpayload.sfid,
        name: inputpayload.name,
        cid: inputpayload.cid,
        runid: response.data.run_id,
        number_in_job: response.data.number_in_job,
        errorcode: "",
        error: 0,
        s3inputfile: inputpayload.s3inputfile,
        s3outputfile: ""
      };

      var audience = new Audience(insertdata);
      audience.save(function(err, u) {
        if (err) return next(err);
        return res.status(200).json(response.data);
      });
    })
    .catch(error => {
      var insertdata = {
        sfid: inputpayload.sfid,
        name: inputpayload.name,
        cid: inputpayload.cid,
        runid: "",
        number_in_job: "",
        errorcode: error.response.data,
        error: 1,
        s3inputfile: inputpayload.s3inputfile,
        s3outputfile: ""
      };
      var audience = new Audience(insertdata);
      audience.save(function(err, u) {
        if (err) return next(err);
        return res.status(400).json(response.data);
      });
    });
}

exports.getrequest = function(req, res) {
  Audience.find({}, function(err, audience) {
    /*var audienceMap = {};

    audience.forEach(function(audience) {
      audienceMap[user._id] = audience;
    });*/

    res.send(audience);
  });
};

exports.getjobstatus = async function(req, res) {
  axios({
    method: "get",
    url:
      "https://dbc-4b7aace0-8d1f.cloud.databricks.com/api/2.0/jobs/runs/get-output?run_id=" +
      req.body.run_id,
    headers: { "Content-Type": "application/json", Charset: "UTF-8" },
    auth: {
      username: "aprudhvi@sitomobile.com",
      password: "Prudhvi@9492"
    }
  })
    .then(function(response) {
      return res.status(200).json(response.data);
    })
    .catch(error => {
      return res.status(400).json(response.data);
    });
};
