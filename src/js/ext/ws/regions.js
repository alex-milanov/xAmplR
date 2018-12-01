
import RegionsPlugin from 'wavesurfer.js/src/plugin/regions.js';

export default class ExtWSRegionsPlugin extends RegionsPlugin {
	// constructor(params, ws) {
	// 	super(params, ws);
	// }
	static create(params) {
		const {staticProps} = RegionsPlugin.create(params);
		return {
			name: 'regions',
			deferInit: params && params.deferInit ? params.deferInit : false,
			params,
			staticProps,
			instance: ExtWSRegionsPlugin
		};
	}
	add(params) {
		// console.log(this.params);
		if (this.params.singleRegion === true) {
			this.clear();
		}

		const region = new this.wavesurfer.Region(params, this.wavesurfer);

		this.list[region.id] = region;

		region.on('remove', () => {
			delete this.list[region.id];
		});

		return region;
	}
}
