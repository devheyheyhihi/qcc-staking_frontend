'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { sendTransaction } from '@/api/transaction';
import { validatePrivateKey } from '@/lib/crypto';
import { FiUpload, FiDownload, FiLoader, FiCheckCircle, FiXCircle, FiAlertCircle, FiFile } from 'react-icons/fi';

interface TransferRecord {
  address: string;
  amount: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  txHash?: string;
  error?: string;
}

interface CSVRow {
  '갯수': string;
  '주소': string;
}

export default function BulkTransferPage() {
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<TransferRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [privateKey, setPrivateKey] = useState('');
  const [currentProcessing, setCurrentProcessing] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV 파일 업로드 처리
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    // CSV 파싱
    Papa.parse(uploadedFile, {
      header: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const csvData = results.data as CSVRow[];
        const transferRecords: TransferRecord[] = csvData
          .filter(row => row['주소'] && row['갯수'])
          .map(row => ({
            address: row['주소'].trim(),
            amount: row['갯수'].trim(),
            status: 'pending' as const
          }));
        
        setRecords(transferRecords);
      },
      error: (error) => {
        alert('CSV 파일 파싱 중 오류가 발생했습니다: ' + error.message);
      }
    });
  };

  // 대량 전송 실행
  const handleBulkTransfer = async () => {
    if (!privateKey.trim()) {
      alert('개인키를 입력해주세요.');
      return;
    }

    // 개인키 유효성 검사
    if (!validatePrivateKey(privateKey.trim())) {
      alert('개인키 형식이 올바르지 않습니다. 64자리 16진수를 입력해주세요.');
      return;
    }

    if (records.length === 0) {
      alert('전송할 데이터가 없습니다.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const updatedRecords = [...records];

    for (let i = 0; i < updatedRecords.length; i++) {
      const record = updatedRecords[i];
      setCurrentProcessing(`${record.address} (${record.amount} QCC)`);
      
      // 상태를 processing으로 변경
      updatedRecords[i] = { ...record, status: 'processing' };
      setRecords([...updatedRecords]);

      try {
        const result = await sendTransaction({
          privateKey: privateKey.trim(),
          toAddress: record.address,
          amount: record.amount
        });

        // 성공 처리
        updatedRecords[i] = {
          ...record,
          status: 'success',
          txHash: result.txHash
        };
      } catch (error) {
        // 실패 처리 - 더 상세한 에러 메시지 추출
        let errorMessage = '알 수 없는 오류';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // 서명 관련 에러를 사용자 친화적으로 변환
          if (errorMessage.includes('signed transaction must contain the transaction parameter')) {
            errorMessage = '개인키가 올바르지 않습니다. 유효한 개인키를 입력해주세요.';
          } else if (errorMessage.includes('receiver address is not valid')) {
            errorMessage = '수신자 주소가 유효하지 않습니다.';
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String(error.message);
        }

        console.error(`전송 실패 - 주소: ${record.address}, 에러:`, error);

        updatedRecords[i] = {
          ...record,
          status: 'failed',
          error: errorMessage
        };
      }

      setRecords([...updatedRecords]);
      setProgress(((i + 1) / updatedRecords.length) * 100);

      // 다음 전송 전 잠시 대기 (API 부하 방지)
      if (i < updatedRecords.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsProcessing(false);
    setCurrentProcessing('');
    alert('대량 전송이 완료되었습니다.');
  };

  // 결과 다운로드
  const handleDownloadResults = () => {
    const csvContent = [
      ['번호', '주소', '수량', '상태', '트랜잭션 해시', '오류 메시지'],
      ...records.map((record, index) => [
        (index + 1).toString(),
        record.address,
        record.amount,
        record.status === 'success' ? '성공' : record.status === 'failed' ? '실패' : '대기',
        record.txHash || '',
        record.error || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk_transfer_results_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 예시 파일 다운로드
  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = '/sample_bulk_transfer.csv';
    link.download = 'sample_bulk_transfer.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 상태별 통계
  const stats = {
    total: records.length,
    success: records.filter(r => r.status === 'success').length,
    failed: records.filter(r => r.status === 'failed').length,
    pending: records.filter(r => r.status === 'pending').length
  };

  const getStatusIcon = (status: TransferRecord['status']) => {
    switch (status) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <FiLoader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <FiAlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">대량 QCC 전송</h1>
        
        {/* 파일 업로드 영역 */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">1. CSV 파일 업로드</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              CSV 파일 형식: <code>갯수,주소</code> (첫 번째 행은 헤더)
            </p>
            <div className="flex items-center space-x-4 mb-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-quantum-600 text-white rounded-lg hover:bg-quantum-700 transition-colors"
              >
                <FiUpload className="w-4 h-4" />
                <span>파일 선택</span>
              </button>
              <button
                onClick={handleDownloadSample}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiFile className="w-4 h-4" />
                <span>예시 파일 다운로드</span>
              </button>
              {file && (
                <span className="text-sm text-gray-600">
                  선택된 파일: {file.name} ({records.length}개 레코드)
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
              💡 <strong>팁:</strong> 예시 파일을 다운로드하여 형식을 확인하고, 실제 주소와 수량으로 수정하여 사용하세요.
            </div>
          </div>
        </div>

        {/* 개인키 입력 */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">2. 전송자 개인키 입력</h2>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="개인키를 입력하세요"
            className="input-field w-full"
            disabled={isProcessing}
          />
        </div>

        {/* 실행 버튼 및 진행 상황 */}
        {records.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">3. 전송 실행</h2>
            
            {/* 통계 */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">총 개수</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <div className="text-sm text-green-600">성공</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-red-600">실패</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">대기</div>
              </div>
            </div>

            {/* 진행률 */}
            {isProcessing && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>진행률</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-quantum-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {currentProcessing && (
                  <p className="text-sm text-gray-600 mt-2">
                    현재 처리 중: {currentProcessing}
                  </p>
                )}
              </div>
            )}

            {/* 실행 버튼 */}
            <div className="flex space-x-4">
              <button
                onClick={handleBulkTransfer}
                disabled={isProcessing || !privateKey.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-quantum-600 text-white rounded-lg hover:bg-quantum-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>전송 중...</span>
                  </>
                ) : (
                  <>
                    <span>대량 전송 시작</span>
                  </>
                )}
              </button>

              {records.some(r => r.status !== 'pending') && (
                <button
                  onClick={handleDownloadResults}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>결과 다운로드</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 결과 테이블 */}
        {records.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">전송 결과</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주소</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">트랜잭션 해시</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">오류</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {record.address}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.amount} QCC
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(record.status)}
                          <span className="text-sm text-gray-900 capitalize">
                            {record.status === 'success' ? '성공' : 
                             record.status === 'failed' ? '실패' : 
                             record.status === 'processing' ? '처리중' : '대기'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {record.txHash ? (
                          <span className="text-green-600">{record.txHash}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                        {record.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 