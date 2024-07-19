// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AccessList } from './AccessList';

describe('AccessList', () => {
    it('should be able to run queries against basic permissions', () => {
        const singleAccessList = new AccessList({ grants: 'foo.bar' });
        expect(singleAccessList.query('foo')).toBeUndefined();
        expect(singleAccessList.query('foo.baz')).toBeUndefined();

        expect(singleAccessList.query('foo.bar')).not.toBeUndefined();
        expect(singleAccessList.query('foo.bar')).toEqual({

        });

        const multipleAccessList = new AccessList({ grants: 'foo.bar,foo.baz' });
        expect(multipleAccessList.query('foo')).toBeUndefined();

        expect(multipleAccessList.query('foo.bar')).not.toBeUndefined();
        expect(multipleAccessList.query('foo.bar')).toEqual({

        });

        expect(multipleAccessList.query('foo.baz')).not.toBeUndefined();
        expect(multipleAccessList.query('foo.baz')).toEqual({

        });

        const arrayAccessList = new AccessList({ grants: [ 'foo.bar', 'foo.baz' ] });
        expect(arrayAccessList.query('foo')).toBeUndefined();

        expect(arrayAccessList.query('foo.bar')).toEqual(multipleAccessList.query('foo.bar'));
        expect(arrayAccessList.query('foo.baz')).toEqual(multipleAccessList.query('foo.baz'));
    });

    it('should be able to run queries against expanded permissions', () => {
        const expansions = {
            test: [
                'test.foo',
                'test.bar',
                'test2',
            ],
        };

        const expandedAccessList = new AccessList({ expansions, grants: 'test' });
        expect(expandedAccessList.query('example')).toBeUndefined();
        expect(expandedAccessList.query('test.qux')).toBeUndefined();

        expect(expandedAccessList.query('test')).not.toBeUndefined();
        expect(expandedAccessList.query('test')).toEqual({

        });

        expect(expandedAccessList.query('test.foo')).not.toBeUndefined();
        expect(expandedAccessList.query('test.foo')).toEqual({

        });

        expect(expandedAccessList.query('test.bar')).not.toBeUndefined();
        expect(expandedAccessList.query('test.bar')).toEqual({

        });

        expect(expandedAccessList.query('test2')).not.toBeUndefined();
        expect(expandedAccessList.query('test2')).toEqual({

        });
    });

    it('should support nested permission expansion lists', () => {
        const expansions = {
            test: [
                'test.foo',
                'test2',  // <-- nested
            ],
            test2: [
                'test.bar',
                'test3',
            ],
        };

        const nestedAccessList = new AccessList({ expansions, grants: 'test' });
        expect(nestedAccessList.query('test')).not.toBeUndefined();
        expect(nestedAccessList.query('test')).toEqual({

        });

        expect(nestedAccessList.query('test.foo')).not.toBeUndefined();
        expect(nestedAccessList.query('test.foo')).toEqual({

        });

        expect(nestedAccessList.query('test.bar')).not.toBeUndefined();
        expect(nestedAccessList.query('test.bar')).toEqual({

        });

        expect(nestedAccessList.query('test2')).not.toBeUndefined();
        expect(nestedAccessList.query('test2')).toEqual({

        });

        expect(nestedAccessList.query('test3')).not.toBeUndefined();
        expect(nestedAccessList.query('test3')).toEqual({

        });
    });

    it('should protect against loops in permission expansion lists', () => {
        const expansions = {
            test: [
                'test.foo',
                'test',  // <-- circular
            ],
        };

        const nestedAccessList = new AccessList({ expansions, grants: 'test' });
        expect(nestedAccessList.query('test')).not.toBeUndefined();
        expect(nestedAccessList.query('test.foo')).not.toBeUndefined();
        expect(nestedAccessList.query('test.bar')).toBeUndefined();
    });
});
