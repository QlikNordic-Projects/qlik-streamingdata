# StreamingData

This project will demonstrate how Qlik Sense could work with Streaming Data. This Streaming application will always show up-to-date temperature and humidity sensor data from a REST API generating random data. This is done by using the partial reload functionality in Qlik Sense together with a NodeJs app using Qlik Enigma. The extension included in this project is used to suppress reload in progress errors and updated app error messages.

#### Be Aware

If you have multiple applications that you want to run simultaneously, be aware when you stop streaming in one application, it will stop streaming for all the applications.

## Getting Started

These instructions will guide you to set up this demo in your Qlik Sense enviroment. 

* Download or Clone this Repo
* Place the StreamingDemo.qvf in the app folder
* Add the extenstion to Qlik Sense Enviroment

### Prerequisites

* Qlik Sense Enterprise on Windows
* Node Js
* Signed certificate or same certificate that you use for the proxy placed in the direcotry

### Installing

Install all the packages

```
npm install
```


## Deployment

Qlik Sense Enterprise
* Go to the streamingdemo application in Qlik Sense hub 
* Open Data load editor
* Create a new connection
* Change the URL connection (if you are not running against localhost or port 3000)
* Make sure that your user has rights to read the connection
* Open Qlik Management Console and go to extensions
* Upload the jbi-suppressError.zip

Node app.js
* Open the app.js in a text editor
* Change the required lines
* open a command prompt and run the app

Qlik Sense Application
* Go to Edit Mode and change the Server-URL for the Start & Stop Buttons
* Go to your application and press start. 

run the app
```
node app
```


## Authors

* **Alexander Jaballah** - *https://github.com/Alexanderjaballah*
* **Johan Bäcklin** - *https://github.com/j-backlin*


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
