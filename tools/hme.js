let currentData = null;

// DOM読み込み完了後の初期化
document.addEventListener('DOMContentLoaded', function() {
    // ファイル選択ハンドラ
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('yamlEditor').value = e.target.result;
                parseYaml();
            };
            reader.readAsText(file);
        }
    });

    // 初期化
    parseYaml();
});

// YAML解析
function parseYaml() {
    const yamlText = document.getElementById('yamlEditor').value.trim();
    const container = document.getElementById('treeContainer');
    
    if (!yamlText) {
        showEmptyState();
        return;
    }
    
    try {
        currentData = jsyaml.load(yamlText);
        displayStats();
        displayTree();
    } catch (error) {
        container.innerHTML = 
            '<div class="error">' +
                '<i class="fas fa-exclamation-triangle"></i>' +
                '<strong>YAML解析エラー:</strong> ' + error.message +
            '</div>';
    }
}

// 空状態表示
function showEmptyState() {
    document.getElementById('treeContainer').innerHTML = 
        '<div class="empty-state">' +
            '<div class="empty-icon">📝</div>' +
            '<h3>YAMLを入力してください</h3>' +
            '<p>左側のエディタにHME YAMLを入力するか、ファイルを選択してください</p>' +
        '</div>';
    document.getElementById('statsDisplay').innerHTML = '';
}

// 統計表示
function displayStats() {
    const stats = calculateStats(currentData);
    const progressPercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    
    document.getElementById('statsDisplay').innerHTML = 
        '<div class="stat">' +
            '<div class="stat-number">' + stats.total + '</div>' +
            '<div class="stat-label">Total</div>' +
        '</div>' +
        '<div class="stat">' +
            '<div class="stat-number">' + stats.done + '</div>' +
            '<div class="stat-label">Done</div>' +
        '</div>' +
        '<div class="stat">' +
            '<div class="stat-number">' + stats.doing + '</div>' +
            '<div class="stat-label">Doing</div>' +
        '</div>' +
        '<div class="stat">' +
            '<div class="stat-number">' + progressPercent + '%</div>' +
            '<div class="stat-label">Progress</div>' +
        '</div>';
}

// 統計計算
function calculateStats(data) {
    const stats = { total: 0, done: 0, doing: 0, todo: 0, skip: 0 };
    
    function count(methods) {
        if (!methods) return;
        for (const [key, method] of Object.entries(methods)) {
            stats.total++;
            if (method.status) stats[method.status]++;
            if (method.submethods) count(method.submethods);
        }
    }
    
    if (data && data.methods) count(data.methods);
    return stats;
}

// ツリー表示
function displayTree() {
    const container = document.getElementById('treeContainer');
    let html = '';
    
    if (currentData.project) {
        html += 
            '<div class="project-info">' +
                '<div class="project-title">' + (currentData.project.title || 'プロジェクト名未設定') + '</div>' +
                '<div>' + (currentData.project.goal || 'ゴール未設定') + '</div>' +
            '</div>';
    }
    
    if (currentData.methods) {
        html += renderMethods(currentData.methods);
    }
    
    container.innerHTML = html;
}

// メソッド表示
function renderMethods(methods) {
    let html = '';
    
    for (const [key, method] of Object.entries(methods)) {
        const hasChildren = method.submethods && Object.keys(method.submethods).length > 0;
        const nodeId = 'node_' + Math.random().toString(36).substr(2, 9);
        
        html += '<div class="tree-node">' +
            '<div class="node-header" onclick="toggleNode(\'' + nodeId + '\')">' +
                '<div class="node-toggle ' + (hasChildren ? '' : 'disabled') + '" style="background: ' + (hasChildren ? 'var(--primary)' : 'var(--gray)') + '">' +
                    (hasChildren ? '−' : '•') +
                '</div>' +
                '<div class="node-name">' + key + '</div>' +
                '<div class="badges">' +
                    (method.label ? '<span class="badge badge-' + method.label + '">' + method.label + '</span>' : '') +
                    (method.status ? '<span class="badge badge-' + method.status + '">' + method.status + '</span>' : '') +
                '</div>' +
                '<div class="node-meta">' +
                    (method.performance ? '<span><i class="fas fa-chart-line"></i> ' + method.performance + '</span>' : '') +
                    (method.confidence ? '<span><i class="fas fa-bullseye"></i> ' + method.confidence + '</span>' : '') +
                '</div>' +
            '</div>';
            
        if (method.description || method.notes || method.reason) {
            html += '<div class="node-details">' +
                (method.description ? '<div class="detail-item"><i class="fas fa-info-circle detail-icon"></i><span>' + method.description + '</span></div>' : '') +
                (method.notes ? '<div class="detail-item"><i class="fas fa-sticky-note detail-icon"></i><span>' + method.notes + '</span></div>' : '') +
                (method.reason ? '<div class="detail-item"><i class="fas fa-times-circle detail-icon"></i><span>' + method.reason + '</span></div>' : '') +
            '</div>';
        }
        
        if (hasChildren) {
            html += '<div class="children" id="' + nodeId + '_children">' +
                renderMethods(method.submethods) +
            '</div>';
        }
        
        html += '</div>';
    }
    
    return html;
}

// ノード折りたたみ切り替え
function toggleNode(nodeId) {
    const children = document.getElementById(nodeId + '_children');
    const toggle = document.querySelector('[onclick="toggleNode(\'' + nodeId + '\')"] .node-toggle');
    
    if (!children) return;
    
    if (children.classList.contains('collapsed')) {
        children.classList.remove('collapsed');
        toggle.textContent = '−';
    } else {
        children.classList.add('collapsed');
        toggle.textContent = '+';
    }
}

// 全展開
function expandAll() {
    document.querySelectorAll('.children').forEach(el => el.classList.remove('collapsed'));
    document.querySelectorAll('.node-toggle').forEach(el => {
        if (el.textContent !== '•') el.textContent = '−';
    });
}

// 全折りたたみ
function collapseAll() {
    document.querySelectorAll('.children').forEach(el => el.classList.add('collapsed'));
    document.querySelectorAll('.node-toggle').forEach(el => {
        if (el.textContent !== '•') el.textContent = '+';
    });
}

// YAML保存
function saveYaml() {
    const yamlText = document.getElementById('yamlEditor').value;
    const blob = new Blob([yamlText], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hme_' + new Date().toISOString().split('T')[0] + '.yaml';
    a.click();
    URL.revokeObjectURL(url);
}

// HTMLエクスポート
function exportHtml() {
    if (!currentData) return;
    
    const treeHtml = document.querySelector('.tree-container').innerHTML;
    const projectTitle = currentData.project && currentData.project.title ? currentData.project.title : 'Project';
    
    const exportHtml = '<!DOCTYPE html>\n' +
        '<html lang="ja">\n' +
        '<head>\n' +
        '    <meta charset="UTF-8">\n' +
        '    <title>HME Export - ' + projectTitle + '</title>\n' +
        '    <style>\n' +
        '        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }\n' +
        '        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }\n' +
        '    </style>\n' +
        '</head>\n' +
        '<body>\n' +
        '    <h1>HME Export - ' + projectTitle + '</h1>\n' +
        '    <div class="tree-container">' + treeHtml + '</div>\n' +
        '</body>\n' +
        '</html>';
    
    const blob = new Blob([exportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hme_export_' + new Date().toISOString().split('T')[0] + '.html';
    a.click();
    URL.revokeObjectURL(url);
}