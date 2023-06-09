import { Network, Alchemy } from 'alchemy-sdk'
import React, { useState, useEffect, useContext } from 'react'
import Logo from '../tlUtils/tlBankLogo'
import Image from 'next/image'
import { getCurrentDate, formatWalletAddress } from '../tlUtils/tlUtil'
import { getUnlockDate } from '../tlUtils/tlUtil'
import { getUnlockDateRaw } from '../tlUtils/tlUtil'
import { IoWalletOutline } from 'react-icons/io5'
import { IoMdRadioButtonOff, IoMdRadioButtonOn } from 'react-icons/io'
import { FaEthereum } from 'react-icons/fa'
import { BiInfoCircle } from 'react-icons/bi'
import {
  VStack,
  Stack,
  Container,
  Flex,
  Text,
  Box,
  Icon,
  HStack,
  Button,
  Spacer,
  Heading,
  Divider,
  Input,
  SimpleGrid,
  FormControl,
  FormLabel,
  FormHelperText,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Hide,
} from '@chakra-ui/react'
import { init, useConnectWallet } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import { BigNumber, ethers } from 'ethers'

const infura = "process.env.NEXT_PUBLIC_INFURA_API_KEY"

const injected = injectedModule()

const MAINNET_RPC_URL = `https://mainnet.infura.io/v3/${infura}`
const GOERLI_RPC_URL = `https://goerli.infura.io/v3/${infura}`

const API = '9176eee3-12fa-431c-93c5-27d1f40d4c91'

init({
  apiKey: API,
  wallets: [injected],
  chains: [
    {
      id: '0x5',
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: GOERLI_RPC_URL
    }
  ]
})

const bankToken: string = '0x077154D2931eEC781f8F1a1D0a23Ce6Ef896a2ac'
const TLBankToken: string ='0xD106E28bDcDF9052EC0845754A5a27303FC8095C'

const settings = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.ETH_GOERLI,
}

// init with key and chain info
const alchemy = new Alchemy(settings)

function TlBank() {
  const [value, setValue] = useState('40000000000000000000000')
  const [active, setActive] = useState('40k')
  const [duration, setDuration] = useState('')
  const [lockDate, setLockDate] = useState('')
  const [unlockDate, setUnlockDate] = useState<any | null>(null)
  const [unlockDateRaw, setUnlockDateRaw] = useState<any | null>(null)
  const [endDate, setEndDate] = useState('')
  const [totalHolders, setTotalHolders] = useState(0)
  const [totalLock, setTotalLock] = useState('')
  const [walletBalance, setWalletBalance] = useState('')
  const [allowance, setAllowance] = useState('')
 

  //setAllowance() //setLockedBalance() //()
  
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()

  // create an ethers provider
  let ethersProvider
  let ethersSigner
  let address

  if (wallet) {
    
    ethersProvider =  new ethers.providers.Web3Provider(wallet.provider, 'any')
   
    ethersSigner = ethersProvider.getSigner();

    address = wallet?.accounts[0].address
  }


  const bankTokenABI = [
    {
      name: 'balanceOf',
      inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
      outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      name: 'allowance',
      inputs: [
        { internalType: 'address', name: 'owner', type: 'address' },
        { internalType: 'address', name: 'spender', type: 'address' },
      ],
      outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      name: 'approve',
      inputs: [
        { internalType: 'address', name: 'spender', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]

  const TLBankTokenABI = [
    {
      name: 'createNFT',
      inputs: [
        { internalType: 'address', name: 'recipient', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
        { internalType: 'uint256', name: 'unlockDate', type: 'uint256' },
      ],
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      name: 'lockedBalances',
      inputs: [{ internalType: 'address', name: 'holder', type: 'address' }],
      outputs: [
        { internalType: 'int256', name: 'lockedBalance', type: 'int256' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ]

  const BankTokenContract = new ethers.Contract(
    bankToken,
    bankTokenABI,
    ethersSigner
  );

  const TLBankContract = new ethers.Contract(
    TLBankToken,
    TLBankTokenABI,
    ethersSigner
  );

  const handleButton =  async (bankVal, btn, duration) => {
    setValue(bankVal)
    setActive(btn)
    setDuration(duration)
    const startDate = new Date()
    const endDate = getUnlockDate('-', startDate, duration)
    const endDateRaw = getUnlockDateRaw(startDate, duration)
    setUnlockDateRaw(endDateRaw)
    setUnlockDate(endDate)
    await setApproval()
  }


  useEffect(() => {
    const date = getCurrentDate()
    const endDateRaw = getUnlockDateRaw(date, 6)
    setLockDate(date)
  }, [])

  
  useEffect(() => {
    async function getBalanceAllowanceLockedBalance() {
      if (address) {
        const balance = await BankTokenContract.balanceOf(address);
        const allowance = await BankTokenContract.allowance(address, TLBankToken);
        const lockBalance = await TLBankContract.lockedBalances(address);

        console.log('balance: ', ethers.utils.formatUnits(balance, 18))
        console.log('allowance: ', ethers.utils.formatUnits(allowance, 18))
        console.log('lockBalance: ', ethers.utils.formatUnits(lockBalance, 18))
        
        setWalletBalance(ethers.utils.formatUnits(balance, 18))
        setAllowance(ethers.utils.formatUnits(allowance, 18)) 
        setTotalLock(ethers.utils.formatUnits(lockBalance, 18))
      }
    }

    getBalanceAllowanceLockedBalance()

    async function getHoldersAlchemy() {
      const { owners } = await alchemy.nft.getOwnersForContract(
        '0xD106E28bDcDF9052EC0845754A5a27303FC8095C'
      )
      console.log(owners)
      setTotalHolders(owners.length)
    }
    getHoldersAlchemy()
  }, [address, BankTokenContract, TLBankContract, TLBankToken, alchemy, ethers])


  


  async function setApproval() {
    if (Number(allowance) < Number(ethers.utils.formatEther(value))) {
      try {
        const response = await BankTokenContract.approve(TLBankToken, BigNumber.from(value));
        console.log('response: ', response)
        const transactionHash = response['hash']
        const txReceipt = []
        do {
        let txr = await ethersProvider.getTransactionReceipt(transactionHash)
        txReceipt[0]=txr
        console.log('confirming...')
        } while (txReceipt[0] == null) ;
        console.log(txReceipt[0])
      } 
      catch (err) {
          console.log('error', err )
      }
    }
  }

  async function setLock() {
    if (Number(allowance) >= Number(ethers.utils.formatEther(value))) {
      try {
        const response = await TLBankContract.createNFT(address, BigNumber.from(value), BigNumber.from(1688085000));
        console.log('response: ', response)
        const transactionHash = response['hash']
        const txReceipt = []
        do {
        let txr = await ethersProvider.getTransactionReceipt(transactionHash)
        txReceipt[0]=txr
        console.log('confirming...')
        } while (txReceipt[0] == null) ;
        console.log(txReceipt[0])

      } 
      catch (err) {
          console.log('error', err )
      } 
    }
  }

  return (
    <Container maxW={'6xl'} mx='auto' p={0}>
      <Flex as='nav' py={'10px'}>
        {/* <Logo /> */}
        <Spacer />
        <HStack>
          <Button
            border='1px'
            borderColor='red.500'
            color={'white'}
            bgColor={'black'}>
            <Icon as={FaEthereum} />
          </Button>
          {/* {!account ? ( */}
            <Button  
              disabled={connecting} 
              onClick={() => (wallet ? disconnect(wallet) : connect())}
              border='1px'
              borderColor='red.500'
              color={'white'}
              bgColor={'black'}>
              {connecting ? 'connecting' : wallet ? 'disconnect' : 'Connect a Wallet'}
            </Button>
            {/* ) : (
            <Button
              border='1px'
              borderColor='red.200'
              color={'white'}
              onClick={disconnect}
              bgColor={'black'}>connected
              {formatWalletAddress(account)}
            </Button>
           )} */}
        </HStack>
      </Flex>
      <Divider mb={10} />

      <Box as='section' display={'flex'} justifyContent={'space-between'}>
        <div>
          <Text fontSize={{ base: '8px', md: '12px' }}>
            Available on <Icon as={FaEthereum} /> Etherum Mainnet
          </Text>
          <HStack>
            <Image
              src='/images/bank-token-mobile.png'
              alt='bankToken'
              height={'50px'}
              width={'70px'}
            />
            <Text as='b' fontSize={{ base: '16px', md: '36px' }}>
              LOCK BANK
            </Text>
          </HStack>
        </div>
        <HStack>
          <VStack>
            <Heading
              fontSize={{ base: '10px', md: '14px' }}
              color='rgba(255, 255, 255, 0.7)'>
              Total BANKs Locked
            </Heading>
            <Heading
              color='white'
              as='b'
              fontSize={{ base: '16px', md: '22px' }}>
              {/* {totalLock}K BANK */}
              {totalLock ? `${totalLock} ` : '0 '} BANK
            </Heading>
          </VStack>
          <Divider orientation='vertical' />
          <VStack>
            <Heading
              fontSize={{ base: '10px', md: '14px' }}
              color='rgba(255, 255, 255, 0.7)'>
              Total BANKs Holders
            </Heading>
            <Heading
              color='white'
              as='b'
              fontSize={{ base: '16px', md: '22px' }}>
              {/* 300 Holders */}
              {totalHolders ? `${totalHolders} ` : '0 '}Holders
            </Heading>
          </VStack>
        </HStack>
      </Box>

      {/* <SimpleGrid templateColumns={'repeat(2, 1fr)'} gap={10} mt={10}> */}
      <SimpleGrid
        bg='rgba(1, 1, 1, 100.0)'
        columns={{ base: 1, lg: 2 }}
        gap={10}
        mt={10}>
        <Box
          maxW={'100%'}
          bgColor={'#111111'}
          p={5}
          border={'1px'}
          borderRadius={'5px'}
          borderColor={'gray.700'}>
          <Flex>
            <HStack>
              <IoWalletOutline
                fontSize={'24px'}
                color='rgba(255, 255, 255, 0.7)'
              />

              <Text fontSize={'14px'} color='rgba(255, 255, 255, 0.7)'>
                Wallet Balance
              </Text>
            </HStack>
            <Spacer />
            <Text fontSize={'14px'} fontWeight='600'>
              {walletBalance ? `${walletBalance} ` : '0.0 '}BANK
            </Text>
          </Flex>
          <Divider m={2} />

          <FormControl my='5'>
            <FormLabel fontSize={'14px'} color='rgba(255, 255, 255, 0.7)'>
              You lock
            </FormLabel>
            <Input
              color='white'
              value={ethers.utils.formatEther(value)}
              readOnly
              borderRadius={0}
              bgColor={'#232323'}
              type='email'
              placeholder='Enter Amount'
            />
            <FormHelperText color='white' fontSize={'14px'}>
              Minimum: <span>40,000 BANK</span>
            </FormHelperText>
          </FormControl>

          <Box>
            <FormControl as='fieldset' gap={2}>
              <FormLabel
                as='legend'
                color='rgba(255, 255, 255, 0.7)'
                fontSize={'14px'}
                my='2'>
                Vesting term <Icon as={BiInfoCircle} />
              </FormLabel>
              <Stack
                spacing='24px'
                direction={{ base: 'column', md: 'column', xl: 'row' }}>
                <Button
                  onClick={() => handleButton('40000000000000000000000', '40k', 6)}
                  colorScheme='gray'
                  variant='outline'
                  color='white'
                  value='40k'
                  // fontSize={{ base: '8px', md: '14px' }}
                  fontSize={'14px'}
                  fontWeight={700}
                  w='full'
                  _hover={{ bg: 'none', svg: { fill: 'white' } }}>
                  {active === '40k' ? (
                    <IoMdRadioButtonOn />
                  ) : (
                    <IoMdRadioButtonOff />
                  )}{' '}
                  6 Months @ 40K BANK
                </Button>
                <Button
                  onClick={() => handleButton('80000000000000000000000', '80k', 12)}
                  colorScheme='gray'
                  variant='outline'
                  color='white'
                  value='80k'
                  // fontSize={{ base: '8px', md: '12px' }}
                  fontSize={'14px'}
                  fontWeight={700}
                  w='full'
                  _hover={{ bg: 'none', svg: { fill: 'white' } }}>
                  {active === '80k' ? (
                    <IoMdRadioButtonOn />
                  ) : (
                    <IoMdRadioButtonOff />
                  )}{' '}
                  1 Year @ 80K BANK
                </Button>
              </Stack>
            </FormControl>
          </Box>
          {/* <Divider my={10} /> */}

          <Accordion allowToggle defaultIndex={0} py={10}>
            <AccordionItem>
              <h2>
                <AccordionButton border={'none'} outline='none'>
                  <Box
                    fontSize={'14px'}
                    as='span'
                    flex='1'
                    textAlign='left'
                    color='rgba(255, 255, 255, 0.7)'>
                    Summary
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} bg={'#232323'}>
                <Flex>
                  <Text fontSize={'14px'} color='rgba(255, 255, 255, 0.7)'>
                    Lock Date
                  </Text>
                  <Spacer />
                  {/* <Text fontSize={'14px'} >2023-04-01 09:49</Text> */}
                  <Text fontSize={'14px'}>{lockDate}</Text>
                </Flex>
                <Flex>
                  <Text fontSize={'14px'} color='rgba(255, 255, 255, 0.7)'>
                    Unlock Date
                  </Text>
                  <Spacer />
                  {/* <Text fontSize={'14px'} >2023-04-01 09:49</Text> */}
                  <Text fontSize={'14px'}>{unlockDate}</Text>
                </Flex>
              </AccordionPanel>
            </AccordionItem>
            <Divider />
          </Accordion>
          <Button
            borderRadius={0}
            onClick={setLock}
            bg='red.500'
            _hover={{ bg: 'red.500' }}
            w={'100%'}>
            Confirm
          </Button>
        </Box>
        <Hide below='lg'>
          <Box
            display='flex'
            justifyContent='center'
            bg='rgba(1, 1, 1, 100.0)'
            alignItems='center'>
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              pl={70}
              bg='radial-gradient(at center, rgba(255, 27, 1, 0.3),rgba(255, 27, 1, 0.2), rgba(1, 1, 1, 100.0), rgba(1, 1, 1, 100.0));'>
              <Image
                src='/images/bank-token.png'
                alt='bankToken'
                height={422}
                width={402}
              />
            </Box>
          </Box>
        </Hide>
      </SimpleGrid>
    </Container>
  )
}

export default TlBank
