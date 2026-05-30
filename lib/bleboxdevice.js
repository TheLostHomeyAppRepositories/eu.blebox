'use strict';

const { Device } = require('homey');
const BleBoxAPI = require('./bleboxapi.js')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class BleBoxDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.bbApi = new BleBoxAPI();
    this.polling = false;
    this.hasDiscovery = false;
    this._lastPollSavedAt = 0;

    await this.onBleBoxInit();

    if(this.getSetting('polling_enabled')=='Yes')
    {
      this.addListener('poll', this.pollDevice);
      this.emit('poll');
    }
    else
    {
      if(!this.hasDiscovery) this.setAvailable();
      // First check current device settings (which may change e.g. after firmware upgrade)
      await this.bbApi.getDeviceState(this.getSetting('address'))
      .then(async result => {
        try {
          await this.setSettings(
            {
              product: result.product != null ? String(result.product) : 'n/a',
              hv: result.hv != null ? String(result.hv) : 'n/a',
              fv: result.fv != null ? String(result.fv) : 'n/a',
              apiLevel: result.apiLevel != null ? String(result.apiLevel) : 'n/a'
            }
          )
        } catch(err) { this.log('setSettings error:', err.message); }
      })
      .catch(error => {
        this.log(error);
      })

    }

    this.log(this.getName().concat(' has been initialized'));
  }

  async onBleBoxInit()
  {
    // To be overridden if additional initialization needed
  }

  /**
   * mDNS-SD discovery handlers
   */
  onDiscoveryResult(discoveryResult)
  {
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult)
  {
    this.hasDiscovery = true;
    if(!this.polling) this.emit('poll');
  }

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
      let deviceReachable = true;
      try {
        // First check current device settings (which may change e.g. after firmware upgrade)
        await this.bbApi.getDeviceState(this.getSetting('address'))
        .then(async result => {
          if(!this.hasDiscovery && !this.getAvailable()) this.setAvailable();
          // Only update settings when values actually changed (avoid constant setSettings calls)
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
          if(!this.hasDiscovery && this.getAvailable()) this.setUnavailable();
          this.log(error);
        })

        if(this.getAvailable() && deviceReachable)
        {
          await this.pollBleBox()
          .then(() => {
            // Throttle last_poll setSettings — at most once per 60s.
            // With many devices polling every 1s this was the dominant CPU cost.
            const now = Date.now();
            if (now - this._lastPollSavedAt >= 60000) {
              this._lastPollSavedAt = now;
              const tz = this.homey.clock.getTimezone();
              const date = new Date().toLocaleString('en-GB', { timeZone: tz });
              this.setSettings({ last_poll: date }).catch(() => {});
            }
          })
          .catch(error => {
            if(!this.hasDiscovery && this.getAvailable()) this.setUnavailable();
            this.log(error);
          })
        }
      } catch(err) {
        this.log('Unexpected error in poll loop:', err);
      }

      const interval = this.getSetting('poll_interval');
      if(!this.hasDiscovery && !this.getAvailable())
        await delay(60000);
      else
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

module.exports = BleBoxDevice;
