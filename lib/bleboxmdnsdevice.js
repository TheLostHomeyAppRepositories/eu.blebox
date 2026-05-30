'use strict';

const { Device } = require('homey');
const BleBoxAPI = require('./bleboxapi.js')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class BleBoxMDNSDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.bbApi = new BleBoxAPI();
    this.polling = false;
    this.addListener('poll', this.pollDevice);

    await this.onBleBoxInit();

    this.log(this.getName().concat( ' has been initialized'));
    this.emit('poll');
  }

  async onBleBoxInit()
  {
    // To be overridden if additional initialization needed
  }

  /**
   * if the discovered device is this device - return true
   */
   onDiscoveryResult(discoveryResult)
  {
    return discoveryResult.id === this.getData().id;
  }

  /**
   * This method will be executed once when the device has been found (onDiscoveryResult returned true)
   */
   async onDiscoveryAvailable(discoveryResult)
  {
    if(!this.polling) this.emit('poll');
  }

  /**
   * Update the address and reconnect
   */
   async onDiscoveryAddressChanged(discoveryResult)
  {
    this.log('Address changed.');
    if(discoveryResult.address != '')
    {
      await this.setSettings(
        {
          address: discoveryResult.address
        });
      if(!this.polling) this.emit('poll');
    }
  }

  /**
   * When device was offline and shows up again - reconnect
   */
   onDiscoveryLastSeenChanged(discoveryResult)
  {
    if(!this.polling) this.emit('poll');
  }

  /**
   * polling to get the current state and energy values
   */
  async pollDevice()
	{
    if(this.polling) return;
    this.polling = true;
    while(this.polling)
    {
      try {
        // First check current device settings (which may change e.g. after firmware upgrade)
        if(this.getAvailable())
        {
          let deviceReachable = true;
          await this.bbApi.getDeviceState(this.getSetting('address'))
          .then(async result => {
            // Only update settings when values actually changed
            const newProduct = result.product != null ? String(result.product) : 'n/a';
            const newHv = result.hv != null ? String(result.hv) : 'n/a';
            const newFv = result.fv != null ? String(result.fv) : 'n/a';
            const newApiLevel = result.apiLevel != null ? String(result.apiLevel) : 'n/a';
            if (newProduct !== this.getSetting('product')
              || newHv !== this.getSetting('hv')
              || newFv !== this.getSetting('fv')
              || newApiLevel !== this.getSetting('apiLevel')) {
              try {
                await this.setSettings({
                  product: newProduct,
                  hv: newHv,
                  fv: newFv,
                  apiLevel: newApiLevel
                });
              } catch(err) { this.log('setSettings error:', err.message); }
            }
          })
          .catch(error => {
            deviceReachable = false;
            this.log(error);
          })

          if(deviceReachable)
          {
            await this.pollBleBox()
            .catch(error => {
              this.log(error);
            })
          }
        }
      } catch(err) {
        this.log('Unexpected error in poll loop:', err);
      }

      const interval = this.getSetting('poll_interval');
      await delay(interval > 0 ? interval : 1000);
    }
    this.polling = false;
	}

  async pollBleBox()
  {
    // to be overridden
  }

  async onDeleted()
  {
   this.polling = false;
  }


}

module.exports = BleBoxMDNSDevice;
