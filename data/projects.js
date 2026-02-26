// Project definitions — seeded data
const PROJECT_SEED = {
    clients: [
        { id: 'INS', name: 'Insyte Deutschland' },
        { id: 'VAN', name: 'Vancom IT' }
    ],
    operators: [
        { id: 'DGF', name: 'Deutsche Glasfaser', clientId: 'INS' },
        { id: 'GFP', name: 'Glasfaser Plus', clientId: 'INS' },
        { id: 'UGG', name: 'UGG/Vescon', clientId: 'VAN' }
    ],
    projects: [
        { code: 'HXT', name: 'Höxter Nord', clientId: 'INS', operatorId: 'DGF', lines: ['NE3', 'NE4'], status: 'active' },
        { code: 'RSD', name: 'Roßdorf', clientId: 'INS', operatorId: 'DGF', lines: ['NE3', 'NE4'], status: 'active' },
        { code: 'WCB', name: 'Westconnect Bielefeld', clientId: 'INS', operatorId: 'DGF', lines: ['NE3', 'NE4'], status: 'active' },
        { code: 'QFF', name: 'QFF Roßdorf', clientId: 'INS', operatorId: 'GFP', lines: ['NE4'], status: 'active' },
        { code: 'WRZ', name: 'GF+ Würzburg', clientId: 'INS', operatorId: 'GFP', lines: ['NE4'], status: 'active' },
        { code: 'EHR', name: 'Ehrenkirchen', clientId: 'VAN', operatorId: 'UGG', lines: ['NE4'], status: 'active' }
    ],
    teams: [
        { id: 'WEST-001', name: 'West-001', pin: '2345', client: 'westconnect', members: ['Alejandro Herrera', 'Alexander Herrera'] },
        { id: 'WEST-002', name: 'West-002', pin: '3456', client: 'westconnect', members: ['Juan Correa', 'Eddier Aldana'] },
        { id: 'WEST-003', name: 'West-003', pin: '4567', client: 'westconnect', members: ['Jaime Guzman'] },
        { id: 'WEST-004', name: 'West-004', pin: '5678', client: 'westconnect', members: ['Michel Matos'] },
        { id: 'PLUS-001', name: 'Plus-001', pin: '1234', client: 'glasfaser-plus', members: ['Erick Flores'] }
    ]
};
