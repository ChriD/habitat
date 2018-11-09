// https://github.com/node-red/node-red/wiki/API-Reference
// https://nodered.org/docs/creating-nodes/status


/**
 * This node is an adapter for the habitat system which provides access to the KNX bus
 * it uses the knx library from https://bitbucket.org/ekarak/knx.js
 */
module.exports = function(RED) {

  "use strict"

  const Habitat_Node_Adapter  = require('./habitat-node.adapter.js')

  class Habitat_Node_Adapter_KNX extends Habitat_Node_Adapter
  {
    constructor(_config)
    {
      super(RED, _config)

      var self = this
      this.config = {
        host: '10.0.0.130',
        port: '3671'
      }

      self.isConnected = false

      // the connection is done directly on init of the object, we may skip this by an option setting (manualConnect) and
      // do the connect later on, but ist good as it is for now
      // Here's the API description 'https://bitbucket.org/ekarak/knx.js/src/master/README-API.md?fileviewer=file-view-default'
      // the underlaying knx lib is very reliable! if the connection is lost it will automatically try to reconnect
      // and will trigger the right events aterwards
      this.knx = require('knx').Connection({
        ipAddr : this.config.host,
        ipPort : this.config.port,
        handlers: {
          connected: function() {
            self.logInfo("Connection to KNX-Bus extablished")
            self.isConnected = true
            self.status({fill:"green",shape:"dot",text:"connected"})
          },
          // we do emit the events of the lib so the knx nodes can attach
          event: function(_event, _source, _destination, _value) {
            self.logDebug("Event: " + _event + " Source: " + _source.toString() + " Destination: " + _destination.toString() + " Value:" + _value.toString())
            switch(_event.toUpperCase())
            {
              case "GROUPVALUE_WRITE":
                self.emit("gaReceived",_source, _destination, _value['0'], _value)
                break
              default:
                self.logWarning("Event: " + _event + " not considered!")
            }
          },
          error: function(_connstatus) {
            self.isConnected = false
            self.status({fill:"red",shape:"ring",text:"disconnected"})
            self.logError("Connection error: " + _connstatus.toString(), _connstatus)
          }
        }

      })

      RED.nodes.createNode(self, _config)

      // we have to call the created event for some stuff which will be done in the base class
      self.created()
    }

    /**
     * should return a unique persistant id of the adapter instance
     * @return {string}
     */
    getAdapterId()
    {
      var adapterId = super.getAdapterId()
      if(adapterId)
        return adapterId
      return "KNX_01"
    }

    /**
     * should return the type of the adapter
     * this is if there are more instances of one adapter so that we can range the popup on the Adapter selection of the 'things'
     *  @return {string}
     */
    getAdapterType()
    {
      return "KNX"
    }

    /**
     * will be called when node is closing
     */
    close()
    {
      this.knx.Disconnect()
      super.close()
    }

    /**
     * send values onto the knx  bus
     * @param {integer} _channel starting channel wheer the -values are going to be set
     * @param {integer[]} _values values to be set from starting channel
     */
    sendToKnx(_channel, _values)
    {
      // TODO: @@@
    }

  }

  RED.nodes.registerType("habitat-adapter-knx", Habitat_Node_Adapter_KNX)
}
