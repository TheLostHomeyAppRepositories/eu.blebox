'use strict';

const BleBoxDevice = require('../../lib/bleboxdevice.js');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class actionBoxDevice extends BleBoxDevice {

  async onBleBoxInit()
  {
    const myIp = await this.homey.cloud.getLocalAddress();
    const address = this.getSetting("address");
    const deviceId = this.getData().id;
    const actions = [
      { id: 1, action: 'click' },
      { id: 2, action: 'clickLong' },
      { id: 3, action: 'fallingEdge' },
      { id: 4, action: 'risingEdge' },
      { id: 5, action: 'anyEdge' },
    ];
    let slot = 10;
    for (let input = 0; input < 4; input++) {
      for (const a of actions) {
        const url = `http://${myIp}/api/app/eu.blebox/actionBox?device=${deviceId}&input=${input + 1}&action=${a.action}`;
        await this.bbApi.actionBoxRegisterWebhook(address, slot, input, a.id, url)
        .catch(err => {
          this.log(err);
        });
        await delay(300);
        slot++;
      }
    }
  }

  async pollBleBox() 
	{

	}

  async onButtonClicked(inputNo)
  {
    const buttonClicked = this.homey.flow.getDeviceTriggerCard('button'+inputNo+'_clicked');
    await buttonClicked.trigger(this,{},{});
  }

  async onButtonClickedLong(inputNo)
  {
    const buttonClickedLong = this.homey.flow.getDeviceTriggerCard('button'+inputNo+'_clicked_long');
    await buttonClickedLong.trigger(this,{},{});
  }

  async onButtonFallingEdge(inputNo)
  {
    const buttonFallingEdge = this.homey.flow.getDeviceTriggerCard('button'+inputNo+'_falling_edge');
    await buttonFallingEdge.trigger(this,{},{});
  }

  async onButtonRisingEdge(inputNo)
  {
    const buttonRisingEdge = this.homey.flow.getDeviceTriggerCard('button'+inputNo+'_rising_edge');
    await buttonRisingEdge.trigger(this,{},{});
  }

  async onButtonAnyEdge(inputNo)
  {
    const buttonAnyEdge = this.homey.flow.getDeviceTriggerCard('button'+inputNo+'_any_edge');
    await buttonAnyEdge.trigger(this,{},{});
  }
}

module.exports = actionBoxDevice;
