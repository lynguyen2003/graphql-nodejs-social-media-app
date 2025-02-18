import os from 'os';

export const getListOfIPV4Address = ({ skipLocalhost = false } = {}) => {
	const ifaces = os.networkInterfaces();

	let result = [];

	Object.keys(ifaces).forEach(function (ifname) {
		ifaces[ifname].forEach(function (iface) {
			// skip non-ipv4 addresses
			if ('IPv4' !== iface.family) {
				return;
			}

			if (skipLocalhost) {
				// skip over internal (i.e. 127.0.0.1)
				if (iface.internal !== false) {
					return;
				}
			}

			result.push(iface.address);
		});
	});

	return result;
};
