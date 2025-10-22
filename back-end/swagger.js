const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',

    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Users',
        description: 'User management',
      },
      {
        name: 'Roles',
        description: 'Role management',
      },
      {
        name: 'Authentication',
        description: 'User authentication',
      },
      {
        name: 'Settings',
        description: 'Application settings management',
      },
      {
        name: 'Industries',
        description: 'Industry management',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
            email: {
              type: 'string',
              description: 'User email',
            },
            role_id: {
              type: 'integer',
              description: 'Role ID',
            },
            is_active: {
              type: 'boolean',
              description: 'User active status',
            },
            image: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                },
                filename: {
                  type: 'string',
                },
                original_name: {
                  type: 'string',
                },
                mime_type: {
                  type: 'string',
                },
                size: {
                  type: 'integer',
                },
                path: {
                  type: 'string',
                },
                url: {
                  type: 'string',
                },
              },
              nullable: true,
            },
            role: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                },
                name: {
                  type: 'string',
                },
                description: {
                  type: 'string',
                },
              },
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        UserInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'User name',
            },
            email: {
              type: 'string',
              description: 'User email',
            },
            password: {
              type: 'string',
              description: 'User password',
            },
            is_active: {
              type: 'boolean',
              description: 'User active status',
            },
          },
          required: ['name', 'email', 'password'],
        },
        Role: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Role ID',
            },
            name: {
              type: 'string',
              description: 'Role name',
            },
            description: {
              type: 'string',
              description: 'Role description',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Role creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Role last update timestamp',
            },
          },
        },
        RoleInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Role name',
            },
            description: {
              type: 'string',
              description: 'Role description',
            },
          },
          required: ['name'],
        },
        Setting: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Setting ID',
            },
            setting_key: {
              type: 'string',
              description: 'Setting key',
            },
            setting_group: {
              type: 'string',
              description: 'Setting group',
            },
            setting_value: {
              type: 'string',
              description: 'Setting value',
            },
            description: {
              type: 'string',
              description: 'Setting description',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Setting creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Setting last update timestamp',
            },
          },
        },
        SettingInput: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Setting key',
            },
            value: {
              type: 'string',
              description: 'Setting value',
            },
            group: {
              type: 'string',
              description: 'Setting group',
            },
            description: {
              type: 'string',
              description: 'Setting description',
            },
          },
          required: ['key'],
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page',
            },
            total: {
              type: 'integer',
              description: 'Total number of items',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
          },
        },
        Industry: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Industry ID',
            },
            name: {
              type: 'string',
              description: 'Industry name',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Industry creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Industry last update timestamp',
            },
          },
        },

      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // files containing annotations as above
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
