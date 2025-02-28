import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
	type DeleteResult {
		deletedCount: Int!
	}

	input PaginationInput {
		page: Int = 1
		limit: Int = 10
	}
	
`;