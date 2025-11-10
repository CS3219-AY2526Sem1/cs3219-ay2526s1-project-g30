import { describe, it, expect } from 'vitest';
import { generateFunctionTemplate } from './generateSignature.js';

describe('generateFunctionTemplate', () => {

    it('handles no parameters', () => {
        const question = {
            function_name: 'doNothing',
            function_params: [],
            function_return: { python: 'None', java: 'void', cpp: 'void' }
        };

        const py = generateFunctionTemplate(question, 'python');
        expect(py.signature).toBe('def doNothing() -> None');
        expect(py.definitions).toBe('');

        const java = generateFunctionTemplate(question, 'java');
        expect(java.signature).toBe('public void doNothing()');
        expect(java.definitions).toBe('');

        const cpp = generateFunctionTemplate(question, 'cpp');
        expect(cpp.signature).toBe('void doNothing()');
        expect(cpp.definitions).toBe('');
    });

    it('handles multiple parameters with some definitions', () => {
        const question = {
            function_name: 'processNode',
            function_params: [
                {
                    name: 'node',
                    langType: { python: 'ListNode', java: 'ListNode', cpp: 'ListNode*' },
                    definition: { python: 'class ListNode: ...', java: 'class ListNode { ... }' } // missing cpp definition
                },
                {
                    name: 'value',
                    langType: { python: 'int', java: 'int', cpp: 'int' }
                }
            ],
            function_return: { python: 'ListNode', java: 'ListNode', cpp: 'ListNode*' }
        };

        const py = generateFunctionTemplate(question, 'python');
        expect(py.signature).toBe('def processNode(node: ListNode, value: int) -> ListNode');
        expect(py.definitions).toContain('class ListNode');

        const java = generateFunctionTemplate(question, 'java');
        expect(java.signature).toBe('public ListNode processNode(ListNode node, int value)');
        expect(java.definitions).toContain('class ListNode');

        const cpp = generateFunctionTemplate(question, 'cpp');
        expect(cpp.signature).toBe('ListNode* processNode(ListNode* node, int value)');
        expect(cpp.definitions).toBe(''); // no cpp definition provided
    });

    it('handles missing definition fields gracefully', () => {
        const question = {
            function_name: 'noDefs',
            function_params: [
                {
                    name: 'data',
                    langType: { python: 'str', java: 'String', cpp: 'string' },
                    definition: {} // empty definition
                }
            ],
            function_return: { python: 'str', java: 'String', cpp: 'string' }
        };

        const py = generateFunctionTemplate(question, 'python');
        expect(py.definitions).toBe('');

        const java = generateFunctionTemplate(question, 'java');
        expect(java.definitions).toBe('');

        const cpp = generateFunctionTemplate(question, 'cpp');
        expect(cpp.definitions).toBe('');
    });

    it('throws an error for unsupported language', () => {
        const question = {
            function_name: 'foo',
            function_params: [],
            function_return: { python: 'int', java: 'int', cpp: 'int' }
        };

        expect(() => generateFunctionTemplate(question, 'ruby')).toThrow('Unsupported language');
    });

});
