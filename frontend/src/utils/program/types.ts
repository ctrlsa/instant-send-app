/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/instant_send_program.json`.
 */
export type InstantSendProgram = {
  address: 'BCLTR5fuCWrMUWc75yKnG35mtrvXt6t2eLuPwCXA93oY'
  metadata: {
    name: 'instantSendProgram'
    version: '0.1.0'
    spec: '0.1.0'
    description: 'Created with Anchor'
  }
  instructions: [
    {
      name: 'initializeTransferSol'
      discriminator: [138, 96, 28, 208, 233, 163, 159, 237]
      accounts: [
        {
          name: 'sender'
          writable: true
          signer: true
        },
        {
          name: 'escrowAccount'
          writable: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
        {
          name: 'rent'
          address: 'SysvarRent111111111111111111111111111111111'
        }
      ]
      args: [
        {
          name: 'amount'
          type: 'u64'
        },
        {
          name: 'expirationTime'
          type: 'i64'
        },
        {
          name: 'hashOfSecret'
          type: {
            array: ['u8', 32]
          }
        }
      ]
    },
    {
      name: 'initializeTransferSpl'
      discriminator: [250, 179, 34, 95, 244, 49, 121, 61]
      accounts: [
        {
          name: 'sender'
          writable: true
          signer: true
        },
        {
          name: 'escrowAccount'
          writable: true
        },
        {
          name: 'escrowTokenAccount'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'account'
                path: 'escrowAccount'
              },
              {
                kind: 'const'
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                kind: 'account'
                path: 'tokenMint'
              }
            ]
            program: {
              kind: 'const'
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: 'senderTokenAccount'
          writable: true
        },
        {
          name: 'tokenMint'
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
        {
          name: 'tokenProgram'
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
        {
          name: 'associatedTokenProgram'
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
        },
        {
          name: 'rent'
          address: 'SysvarRent111111111111111111111111111111111'
        }
      ]
      args: [
        {
          name: 'amount'
          type: 'u64'
        },
        {
          name: 'expirationTime'
          type: 'i64'
        },
        {
          name: 'hashOfSecret'
          type: {
            array: ['u8', 32]
          }
        }
      ]
    },
    {
      name: 'redeemFundsSol'
      discriminator: [201, 132, 159, 241, 223, 196, 178, 29]
      accounts: [
        {
          name: 'signer'
          writable: true
          signer: true
        },
        {
          name: 'recipient'
          writable: true
        },
        {
          name: 'escrowAccount'
          writable: true
        },
        {
          name: 'sender'
          writable: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        }
      ]
      args: [
        {
          name: 'secret'
          type: 'string'
        }
      ]
    },
    {
      name: 'redeemFundsSpl'
      discriminator: [129, 43, 205, 106, 199, 166, 129, 13]
      accounts: [
        {
          name: 'signer'
          writable: true
          signer: true
        },
        {
          name: 'recipient'
          writable: true
        },
        {
          name: 'escrowAccount'
          writable: true
        },
        {
          name: 'escrowTokenAccount'
          writable: true
        },
        {
          name: 'recipientTokenAccount'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'account'
                path: 'recipient'
              },
              {
                kind: 'const'
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                kind: 'account'
                path: 'tokenMint'
              }
            ]
            program: {
              kind: 'const'
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: 'tokenMint'
        },
        {
          name: 'sender'
          writable: true
        },
        {
          name: 'tokenProgram'
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
        {
          name: 'associatedTokenProgram'
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
        {
          name: 'rent'
          address: 'SysvarRent111111111111111111111111111111111'
        }
      ]
      args: [
        {
          name: 'secret'
          type: 'string'
        }
      ]
    }
  ]
  accounts: [
    {
      name: 'escrowAccount'
      discriminator: [36, 69, 48, 18, 128, 225, 125, 135]
    },
    {
      name: 'escrowSolAccount'
      discriminator: [254, 87, 94, 62, 155, 182, 159, 157]
    }
  ]
  errors: [
    {
      code: 6000
      name: 'alreadyRedeemed'
      msg: 'The funds have already been redeemed.'
    },
    {
      code: 6001
      name: 'notExpired'
      msg: 'The transfer has not expired yet.'
    },
    {
      code: 6002
      name: 'invalidSecret'
      msg: 'The secret is invalid'
    }
  ]
  types: [
    {
      name: 'escrowAccount'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'sender'
            type: 'pubkey'
          },
          {
            name: 'amount'
            type: 'u64'
          },
          {
            name: 'expirationTime'
            type: 'i64'
          },
          {
            name: 'isRedeemed'
            type: 'bool'
          },
          {
            name: 'tokenMint'
            type: 'pubkey'
          },
          {
            name: 'hashOfSecret'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'bump'
            type: 'u8'
          }
        ]
      }
    },
    {
      name: 'escrowSolAccount'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'sender'
            type: 'pubkey'
          },
          {
            name: 'amount'
            type: 'u64'
          },
          {
            name: 'expirationTime'
            type: 'i64'
          },
          {
            name: 'isRedeemed'
            type: 'bool'
          },
          {
            name: 'hashOfSecret'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'bump'
            type: 'u8'
          }
        ]
      }
    }
  ]
  constants: [
    {
      name: 'seedEscrowSpl'
      type: 'bytes'
      value: '[101, 115, 99, 114, 111, 119, 95, 115, 112, 108]'
    }
  ]
}
