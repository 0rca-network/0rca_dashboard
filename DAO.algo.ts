// Agent.algo.ts
import {
  Contract,
  GlobalState,
  BoxMap,
  itxn,
  uint64,
  Global,
  assert,
  abimethod,
  Txn,
  Uint64,
  Account,
  gtxn,
  Application,
  bytes
} from "@cronosfoundation/cronos-typescript";
import { arc4 } from '@cronosfoundation/cronos-typescript';

// Address and ARC4 types live under the arc4 submodule
import { Address } from "@cronosfoundation/cronos-typescript/arc4";

// Task struct: use arc4 types for all fields (including executor -> Address)
class Proposal extends arc4.Struct<{
  id: arc4.UintN64,
  status: arc4.Bool,
  timestamp: arc4.UintN64,
  details: arc4.Str,
  creator: Account
}> {}

export class DaoContract extends Contract {
  // Agent metadata (global)
  name = GlobalState<string>();
  details = GlobalState<string>();
  fixedPricing = GlobalState<uint64>();
  createdAt = GlobalState<uint64>();
  // store addresses as Address (not Account)
  ownerAddress = GlobalState<Account>();
  // Task bookkeeping in boxes (index -> Task struct)
  taskCount = GlobalState<uint64>();
  // BoxMap typed storage for tasks (we store bytes; encode/decode as needed)
  taskBox = BoxMap<uint64, Proposal>({ keyPrefix: '' });

  
  // ----------------------
  // createApplication (initialize single agent)
  // ----------------------
  @abimethod()
  createApplication(agentName: string, agentDetails: string, pricing: uint64): void {
    // store the creator as the owner
    this.ownerAddress.value = Txn.sender ;
    this.name.value = agentName;
    this.details.value = agentDetails;
    this.fixedPricing.value = pricing;
    this.createdAt.value = Global.latestTimestamp;
    this.taskCount.value = 0;
  }

  // ----------------------
  // pay (create task when payment is received)
  // ----------------------
  pay(payTxn: gtxn.PaymentTxn): void {
    // expectedAmount calculation: assume fixedPricing is in Algos -> convert to microalgos
    const expectedAmount: uint64 = Uint64(this.fixedPricing.value * 1_000_000);

    assert(payTxn.receiver === Global.currentApplicationAddress, 'payment must be to app');
    assert(payTxn.amount === expectedAmount, 'Incorrect payment amount');

    // index for new task
    const idx = this.taskCount.value;

    // create new Task; executor must be Address (payTxn.sender is an Address)
    const task = new Proposal({
      id: new arc4.UintN64(idx),
      status: new arc4.Bool(false),
      timestamp: new arc4.UintN64(Global.latestTimestamp),
      details: new arc4.Str("Payment Done!!, Task Created"),
      creator: payTxn.sender
    });

    this.taskBox(idx).value = task.copy();

    // increment taskCount exactly once
    this.taskCount.value = (idx + (1 as uint64)) as uint64;
  }

  // ----------------------
  // updateTask
  // ----------------------
  updateTask(
    idx: uint64,
    updateStatus: arc4.Bool,
    updateDetails: arc4.Bool,
    updateCreator: arc4.Bool,
    status: arc4.Bool,
    details: arc4.Str,
    creator: Account
  ): void {
    const currentTask = this.taskBox(idx).value.copy();

    // use the boolean .value from arc4.Bool to decide whether to overwrite
    const updatedTask = new Proposal({
  id: new arc4.UintN64(idx),
  timestamp: new arc4.UintN64(Global.latestTimestamp),
  status: updateStatus.native ? status : currentTask.status,
  details: updateDetails.native ? details : currentTask.details,
  creator: updateCreator.native ? creator : currentTask.creator,
});

    this.taskBox(idx).value = updatedTask.copy();
  }

  withdraw(to: Account, amount: uint64): void {
    assert(Txn.sender === this.ownerAddress.value, 'only owner');

    itxn
      .payment({
        amount: amount,
        receiver: to,
        fee: 0,
      })
      .submit();
const appID =  Application(747862402);

const callTxn = itxn
      .applicationCall({
        appId:appID,
        appArgs: [arc4.methodSelector('emit_log(string,application,string)'), new arc4.Str('withdraw'), Application(Global.currentApplicationId.id), new arc4.Str("sucess") ],
      })
      .submit()

      
  }


transferOwnership(newOwner: Account): void {
    assert(Txn.sender === this.ownerAddress.value, 'only owner');
    this.ownerAddress.value = newOwner;
  }






}
