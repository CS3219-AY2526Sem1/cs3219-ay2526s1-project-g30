// utils/generateSignature.js
export function generateFunctionTemplate(question, lang) {
    const { function_name, function_params, function_return } = question;

    // Build parameter list
    const params = function_params
        .map(p => (p.langType?.[lang] ?? 'UNKNOWN') + ' ' + p.name)
        .join(', ');

    // Build function signature
    let signature;
    switch (lang) {
        case 'python':
            // Safely build parameter list for Python
            const pyParams = function_params
                .map(p => `${p.name}: ${p.langType?.python ?? 'any'}`) // Use 'any' as fallback
                .join(', ');

            // Safely get return type for Python
            const pyReturn = function_return?.python ?? 'any'; // Use 'any' or 'None' as fallback

            signature = `def ${function_name}(${pyParams}) -> ${pyReturn}`;
            break;
        case 'java':
            signature = `public ${function_return.java} ${function_name}(${params})`;
            break;
        case 'cpp':
            signature = `${function_return.cpp} ${function_name}(${params})`;
            break;
        default:
            throw new Error('Unsupported language');
    }

    // Collect any definitions needed
    const definitions = function_params
        .map(p => p.definition?.[lang])  // optional chaining
        .filter(d => !!d)
        .join('\n\n');

    return { signature, definitions };
}