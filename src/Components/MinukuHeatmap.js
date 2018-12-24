import React, { Component } from 'react';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import HeatmapLayer from 'react-leaflet-heatmap-layer';
import L from 'leaflet';
import axios from 'axios';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

export const apiHost = `https://dashboardapi.mcog.minuku.org`;

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12.5,41],
});

L.Marker.prototype.options.icon = DefaultIcon;

class MinukuHeatmap extends Component {
  state = {
    mapHidden: false,
    layerHidden: false,
    addressPoints: [],
    radius: 11,
    blur: 18,
    max: 3.5,
    maxZoom: 18,
    minOpacity: 0.01,
    intensity: 1,
    popupLat: null,
    popupLng: null,
    markerList: [],
    curLabelName: '',
    curUserId: null,
  };

  async refetchHeatPoints() {
    const {curUserId} = this.state;
    const res = await axios.get(`${apiHost}/heatmap/listheatpoints?userid=${curUserId}`);
    console.log({res});
    const heatPoints = res.data;
    this.setState({addressPoints: heatPoints});
  }

  async refetchMarkers() {
    const {curUserId} = this.state;
    const res = await axios.get(`${apiHost}/heatmap/listmarkers?userId=${curUserId}`);
    const markerList = res.data;
    this.setState({markerList, popupLat: null, popupLng: null});
  }

  renderPopup() {
    const {popupLat, popupLng} = this.state;
    if(popupLat!== null && popupLng!==null){
      return <Popup position={[popupLat, popupLng]} onClose={()=>{
        this.setState({popupLat: null, popupLng:null, curLabelName: ''});
      }}>
        <span>You clicked on</span>
        <br/><span>{`Lng:${popupLng}`}</span>
        <br/><span>{`Lat:${popupLat}`}</span>
        <br/><input type="text" name="name" onChange={(e)=>{
          this.setState({curLabelName: e.target.value});
        }}/>
        <br/><input
          type="button"
          value="Add Marker"
          onClick={() => {
            this.addMarker(popupLat, popupLng, this.state.curLabelName);
          }}
        />
      </Popup>;
    } else return null;
  }

  renderMarkers() {
    const {markerList} = this.state;
    return markerList.map((m, idx)=>{
      const {lng, lat, name, _id} = m;
      return <Marker key={idx} position={[lat, lng]} title={name} >
      <Popup>
        <br/><span>{`Lng:${lng}`}</span>
        <br/><span>{`Lat:${lat}`}</span>
        <br/><span>{`Name:${name}`}</span>
        <br/><input
          type="button"
          value="Remove Marker"
          onClick={() => {
            this.removeMarker(_id);
          }}
        />
      </Popup>
    </Marker>;
    });
  }

  onCreatePopup(e) {
    const {lat, lng} = e.latlng;
    this.setState({
      popupLat: lat,
      popupLng: lng,
    });
  }

  async removeMarker(_id) {
    const res = await axios.post(`${apiHost}/heatmap/removemarker`,{
      _id
    });
    if(res.status!==200) {
      alert('移除失敗');
      return;
    }
    alert('移除成功');
    this.refetchMarkers();
  }

  async addMarker(lat, lng, name) {
    const {curUserId} = this.state;
    const res = await axios.post(`${apiHost}/heatmap/addmarker`,{
      lat, lng, name, userId:curUserId,
    });
    if(res.status!==200) {
      alert(`新增地標失敗`);
      return;
    }
    alert(`已經替userId:${curUserId}新增了地標:${name}`);
    this.refetchMarkers();
  }

  render() {
    if (this.state.mapHidden) {
      return (
        <div>
          <input
            type="button"
            value="Toggle Map"
            onClick={() => this.setState({ mapHidden: !this.state.mapHidden })}
          />
        </div>
      );
    }

    const gradient = {
      0.1: '#89BDE0', 0.2: '#96E3E6', 0.4: '#82CEB6',
      0.6: '#FAF3A5', 0.8: '#F5D98B', '1.0': '#DE9A96'
    };

    return (
      <div className="heatmap-container">
        <Map className="heatmap" center={[24.786520252180928, 120.99776387214662]} zoom={16} onClick={(e)=>{
            this.onCreatePopup(e);
          }} >
          {this.renderPopup()}
          {this.renderMarkers()}
          {!this.state.layerHidden &&
              <HeatmapLayer
                fitBoundsOnLoad
                points={this.state.addressPoints}
                longitudeExtractor={m => m[1]}
                latitudeExtractor={m => m[0]}
                gradient={gradient}
                intensityExtractor={m => parseFloat(2)}
                radius={Number(this.state.radius)}
                blur={Number(this.state.blur)}
                maxZoom={Number(this.state.maxZoom)}
                minOpacity={Number.parseFloat(this.state.minOpacity)}
                max={Number.parseFloat(this.state.max)}
              />
            }
          <TileLayer
            url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          />
        </Map>
        <div className="control-panel">
          <input
            type="button"
            value="Toggle Layer"
            onClick={() => this.setState({ layerHidden: !this.state.layerHidden })}
          />
          <div>
            Radius
            <br/>
            <input
              type="range"
              min={1}
              max={40}
              value={this.state.radius}
              onChange={(e) => this.setState({ radius: e.currentTarget.value })}
            /> <br/> {this.state.radius}
          </div>
          <br/>
          <div>
            Blur
            <br/>
            <input
              type="range"
              min={1}
              max={30}
              value={this.state.blur}
              onChange={(e) => this.setState({ blur: e.currentTarget.value })}
            /> <br/> {this.state.blur}
          </div>
          <br/>
          <div>
            Max
            <br/>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={this.state.max}
              onChange={(e) => this.setState({ max: e.currentTarget.value })}
            /> <br/> {this.state.max}
          </div>
          <br/>
          <div>
            maxZoom
            <br/>
            <input
              type="range"
              min={1}
              max={36}
              step={1}
              value={this.state.maxZoom}
              onChange={(e) => this.setState({ maxZoom: e.currentTarget.value })}
            /> <br/> {this.state.maxZoom}
          </div>
          <br/>
          <div>
            minOpacity
            <br/>
            <input
              type="range"
              min={0}
              max={0.2}
              step={0.01}
              value={this.state.minOpacity}
              onChange={(e) => this.setState({ minOpacity: e.currentTarget.value })}
            /> <br/> {this.state.minOpacity}
          </div>
          <br/>
          <div>
            intensity
            <br/>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.1}
              value={this.state.intensity}
              onChange={(e) => this.setState({ intensity: e.currentTarget.value })}
            /> <br/> {this.state.intensity}
          </div>
          <br/>
          <div>
            userid:
            <input type="text" name="name" onChange={(e)=>{
              const userId = e.target.value;
              this.setState({curUserId: userId});
            }}/>
            <input
              type="button"
              value="Fetch data"
              onClick={() => {
                this.refetchHeatPoints()
                this.refetchMarkers();
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default MinukuHeatmap;
