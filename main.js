const sensor = require("node-dht-sensor");
const SENSOR_TYPE = 22;
const SENSOR_PIN = 13;

const TM1637 = require("raspberrypi-tm1637");
const CLKPIN = 2;
const DIOPIN = 0;
let tm = new TM1637(CLKPIN, DIOPIN);

class SensorReader {
	constructor() {
		this.temp = 0;
		this.humidity = 0;
		sensor.initialize(SENSOR_TYPE, SENSOR_PIN);
	}

	toFarenheit(temp) {
		return (temp * 1.8) + 32;
	}
	read() {
		let {temperature, humidity} = sensor.read(SENSOR_TYPE, SENSOR_PIN);
		this.temp = this.toFarenheit(temperature);
		this.humidity = humidity;
	  	console.log(`Temp ${this.temp}`);
		console.log(`Humidity ${this.humidity}`);
		tm.text = this.temp.toFixed(2) + "F";
		setTimeout(() => {this.read();}, 2000);
	}
}

tm.text = "init";
let reader = new SensorReader();
setTimeout(() => {reader.read()}, 3000);

const prometheus = require('prom-client');
new prometheus.Gauge({
	name: 'tempsensor_DHT22_temperature',
	help: `Temperature from DHT22 on ${SENSOR_PIN}`,
	collect() {
		this.set(reader.temp);
	}
});
new prometheus.Gauge({
	name: 'tempsensor_DHT22_humidity',
	help: `Humidity from DHT22 on ${SENSOR_PIN}`,
	collect() {
		this.set(reader.humidity);
	}
});

const httpServer = require('express')();
const PORT = 5555;
httpServer.get('/metrics', async (req, res) => {
	let metrics = await prometheus.register.metrics();
	res.send(metrics);
});

httpServer.listen(PORT, () => {
	console.log(`Server started, listening at port ${PORT}`)
});
