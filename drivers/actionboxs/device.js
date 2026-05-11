'use strict';

const BleBoxDevice = require('../../lib/bleboxdevice.js');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class actionBoxSDevice extends BleBoxDevice {

  async onBleBoxInit()
  {
    const myIp = await this.homey.cloud.getLocalAddress();
    const address = this.getSetting("address");
    const deviceId = this.getData().id;
    const actions = [
      { slot: 25, id: 1, action: 'click' },
      { slot: 26, id: 2, action: 'clickLong' },
      { slot: 27, id: 3, action: 'fallingEdge' },
      { slot: 28, id: 4, action: 'risingEdge' },
      { slot: 29, id: 5, action: 'anyEdge' },
    ];
    for (const a of actions) {
      const url = `http://${myIp}/api/app/eu.blebox/actionBoxS?device=${deviceId}&action=${a.action}`;
      await this.bbApi.actionBoxRegisterWebhook(address, a.slot, 0, a.id, url)
      .catch(err => {
        this.log(err);
      });
      await delay(300);
    }
  }

  async pollBleBox() 
	{

	}

  async onButtonClicked()
  {
    const buttonClicked = this.homey.flow.getDeviceTriggerCard('button_clicked');
    await buttonClicked.trigger(this,{},{});
  }

  async onButtonClickedLong()
  {
    const buttonClickedLong = this.homey.flow.getDeviceTriggerCard('button_clicked_long');
    await buttonClickedLong.trigger(this,{},{});
  }

  async onButtonFallingEdge()
  {
    const buttonFallingEdge = this.homey.flow.getDeviceTriggerCard('button_falling_edge');
    await buttonFallingEdge.trigger(this,{},{});
  }

  async onButtonRisingEdge()
  {
    const buttonRisingEdge = this.homey.flow.getDeviceTriggerCard('button_rising_edge');
    await buttonRisingEdge.trigger(this,{},{});
  }

  async onButtonAnyEdge()
  {
    const buttonAnyEdge = this.homey.flow.getDeviceTriggerCard('button_any_edge');
    await buttonAnyEdge.trigger(this,{},{});
  }
}

module.exports = actionBoxSDevice;
