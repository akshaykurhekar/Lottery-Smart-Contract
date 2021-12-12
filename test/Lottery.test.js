const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider());
const {interface, bytecode} = require('../compile');

let lottery;
let accounts;

// beforeEach will execute each time before every test case, so we define account and instance of contract in it.
beforeEach( async ()=>{
    accounts = await web3.eth.getAccounts();

    // instance of contract
    lottery = await new web3.eth.Contract( JSON.parse(interface))
    .deploy({ data:bytecode })
    .send({ from:accounts[0], gas:'1000000'});
});


describe('Lottery test',()=>{
    it('Deployed Contract', ()=>{
        assert.ok(lottery.options.address);
    });

    it('allow one account to enter',async ()=>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({ from: accounts[0]});

        // check player array has exact address
        assert.equal(accounts[0], players[0]);

        // check player has length 1
        assert.equal(1, players.length);

    });

    it('allow multiple account to enter',async ()=>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({ from: accounts[0]});

        // check player array has exact address
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);

        // check player has length 1
        assert.equal(3, players.length);

    });

    it('requires a minimum amount to enter',async ()=>{
        try{
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 0    // this value in wei
            });
            assert(false);  // it will fail test if error not occurs 
        }catch(err){
            assert.ok(err);  // it will check err is exist or not;
        }
    });

    it('only manager can pickWinner',async ()=>{
        
        try{
            await lottery.methods.pickWinner().send({
                from: accounts[1],
            });             
            assert(false);      
        }catch(err){
            assert(err);
        }              
    });

    it('send money to player and reset the players array', async ()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value: web3.utils.toWei('2','ether')
        });

        const initialBalance = await web3.eth.getBalance(accounts[0]); // get the current balance from account in wei's unit

        await lottery.methods.pickWinner().send({
            from:accounts[0]
        });

        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;  
        console.log(difference);      
        assert(difference > web3.utils.toWei('1.5','ether'));
        
        const aa = await web3.eth.getBalance(lottery.options.address);
        console.log('balance ::',aa);
        assert.equal(0,aa);
    });
});
