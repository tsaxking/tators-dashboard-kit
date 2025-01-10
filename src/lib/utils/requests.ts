export namespace Requests {
	class ServerRequests {}

	export const get = async (url: string, headers: HeadersInit = {}) => {};

	export type PostConfig = {
		stream: boolean;
	};
	export const post = async (url: string, body: BodyInit, headers: HeadersInit = {}) => {};
}
