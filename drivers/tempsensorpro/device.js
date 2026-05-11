'use strict';

const BleBoxDevice = require('../../lib/bleboxdevice.js');

class tempSensorProDevice extends BleBoxDevice {

  async pollBleBox()
	{
    await this.bbApi.multiSensorGetState(this.getSetting('address'), this.getSetting('apiLevel'))
    .then(async result => {
      for (const element of result.multiSensor.sensors) {
        if (element.type !== 'temperature') continue;
        if (element.id < 0 || element.id > 3) continue;
        const capName = `measure_temperature.sensor${element.id + 1}`;
        if (!this.hasCapability(capName)) {
          try {
            await this.addCapability(capName);
          } catch (e) {
            this.log('addCapability failed:', capName, e.message);
            continue;
          }
        }
        await this.setCapabilityValue(capName, element.value / 100)
        .catch(err => {
          this.log(err);
        });
      }
    })
    .catch(error => {
      this.log(error);
    })
	}
}

module.exports = tempSensorProDevice;
