import { expect } from 'chai';
import { nameof } from 'ts-simple-nameof';
import { IStoreAction, IStoreActionResult, Store, StoreActionType } from '../src/Store';
import { TestState } from './data/TestState';

describe('Store', () => {
    it('should persist initial values', () => {
        let testState = new TestState();
        testState.foo = 'hello';
        testState.bar = {
            name: 'pugna'
        };

        let store: Store<TestState> = new Store(testState);

        let foo = store.get(nameof((s: TestState) => s.foo));
        let bar: { name: string } = store.get<{ name: string }>(nameof((s: TestState) => s.bar));

        expect(foo).to.equal(testState.foo);
        expect(bar.name).to.equal(testState.bar.name);
    });

    it('should not return reference values', () => {
        let testState = new TestState();
        testState.foo = 'hello';
        testState.bar = {
            name: 'pugna'
        };

        let store: Store<TestState> = new Store(testState);

        let bar: [{ name: string }] = store.get(nameof((s: TestState) => s.bar));

        expect(bar).to.not.equal(testState.bar);
    });

    it('should pass state as first parameter to action', async () => {
        let testState = new TestState();
        testState.foo = 'hello';
        testState.bar = {
            name: 'pugna'
        };

        let store: Store<TestState> = new Store(testState);

        let action: IStoreAction<TestState, { name: string }> = {
            name: 'updatebar',
            property: 'bar',
            action: (state: TestState, name: string) => {
                if (state.bar == null) {
                    state.bar = {
                        name: name
                    };
                } else {
                    state.bar.name = name;
                }

                return Promise.resolve({
                    value: state.bar,
                    action: StoreActionType.UPDATE,
                    affectedItem: state.bar
                } as IStoreActionResult<{ name: string }>);
            }
        } as IStoreAction<TestState, { name: string }>;

        store.registerAction(action);

        let result: IStoreActionResult<{ name: string }> = await store.executeAction(action.name, 'timber') as IStoreActionResult<{ name: string }>;

        expect(result.value.name).to.equal('timber');
        expect((store.get('bar') as any).name).to.equal('timber');
    });

    it('should not execute action if store state has a value other than null', async () => {
        let testState = new TestState();
        testState.foo = 'hello';
        testState.bar = {
            name: 'pugna'
        };

        let store: Store<TestState> = new Store(testState);

        let action: IStoreAction<TestState, { name: string }> = {
            name: 'updatebar',
            property: 'bar',
            action: (state: TestState, name: string) => {
                if (state.bar == null) {
                    state.bar = {
                        name: name
                    };
                } else {
                    state.bar.name = name;
                }

                return Promise.resolve({
                    value: state.bar,
                    action: StoreActionType.UPDATE,
                    affectedItem: state.bar
                } as IStoreActionResult<{ name: string }>);
            }
        } as IStoreAction<TestState, { name: string }>;

        store.registerAction(action);

        let result: IStoreActionResult<{ name: string }> = await store.getOrExecuteAction(action.name, 'timber') as IStoreActionResult<{ name: string }>;

        expect(result.value.name).to.equal('pugna');
        expect((store.get('bar') as any).name).to.equal('pugna');
    });

    it('should not execute action if store state has a value which is an empty array', async () => {
        let testState = new TestState();
        testState.foo = 'hello';
        testState.bar = {
            name: 'pugna'
        };
        testState.a1 = ['pfm'];

        let store: Store<TestState> = new Store(testState);

        let action: IStoreAction<TestState, any> = {
            name: 'updatea1',
            property: 'a1',
            action: (state: TestState, a1: any) => {
                state.a1 = a1;

                return Promise.resolve({
                    value: state.a1,
                    action: StoreActionType.UPDATE,
                    affectedItem: state.a1
                } as IStoreActionResult<any>);
            }
        } as IStoreAction<TestState, any>;

        store.registerAction(action);

        let result: IStoreActionResult<any> = await store.getOrExecuteAction(action.name, ['foo']) as IStoreActionResult<any>;

        expect(result.value[0]).to.equal('pfm');
        expect((store.get('a1') as any)[0]).to.equal('pfm');
    });

    it('should execute action if store state has a value which is an empty array', async () => {
        let testState = new TestState();
        testState.foo = 'hello';
        testState.bar = {
            name: 'pugna'
        };

        let store: Store<TestState> = new Store(testState);

        let action: IStoreAction<TestState, any> = {
            name: 'updatea1',
            property: 'a1',
            action: (state: TestState, a1: any) => {
                state.a1 = a1;

                return Promise.resolve({
                    value: state.a1,
                    action: StoreActionType.UPDATE,
                    affectedItem: state.a1
                } as IStoreActionResult<any>);
            }
        } as IStoreAction<TestState, any>;

        store.registerAction(action);

        let result: IStoreActionResult<any> = await store.getOrExecuteAction(action.name, ['pfm']) as IStoreActionResult<any>;

        expect(result.value[0]).to.equal('pfm');
        let a1a: any = store.get('a1');
        expect(a1a[0]).to.equal('pfm');
    });
});